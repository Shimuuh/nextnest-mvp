# ============================================================
# workflows/emergency_medical.py — Emergency Medical Workflow
# Handles requests like:
#   "Help a child who needs urgent surgery, I have ₹10000"
#   "There's a sick child who needs medical help"
#   "I want to fund emergency treatment for a child"
#
# Key difference from education_donation:
#   - Focuses on ONE child at a time (personal, urgent)
#   - Shows donor top 3 cases to choose from
#   - Full amount goes to one child, not split
#   - Checks if child becomes fully funded after donation
#
# Two modes:
#   propose → find emergency cases, show top 3 with stories
#   execute → send full amount to selected/most urgent child
# ============================================================

from tools.read_tools import (
    search_children,
    rank_by_urgency,
    filter_emergency_cases
)
from tools.write_tools import (
    execute_donation,
    update_funding_status,
    log_donation
)
from agent.intent_classifier import Intent
from config.settings import EMERGENCY_URGENCY_THRESHOLD

# ============================================================
# MAIN FUNCTION — called by operator.py
# ============================================================

async def run(
    intent: Intent,
    user_id: str,
    mode: str,
    proposal: dict = None
) -> dict:
    """
    Main entry point for the emergency medical workflow.
    Called by operator.py in both propose and execute mode.

    Args:
        intent   : classified intent from intent_classifier.py
        user_id  : platform user making the donation
        mode     : "propose" or "execute"
        proposal : saved proposal from propose mode
                   only passed when mode="execute"

    Returns:
        dict — proposal with top 3 emergency cases (propose)
             — impact result with fully-funded check  (execute)
    """

    print(f"[emergency_medical] Running in {mode} mode | "
          f"user={user_id} | amount=₹{intent.amount}")

    if mode == "propose":
        return await _propose(intent, user_id)

    elif mode == "execute":
        if not proposal:
            return {
                "success": False,
                "impact_summary": "No proposal found to execute. Please try again."
            }
        return await _execute(intent, user_id, proposal)

    else:
        return {
            "success": False,
            "impact_summary": f"Unknown mode: {mode}"
        }


# ============================================================
# PROPOSE MODE — find emergency cases, return top 3
# No database writes happen here.
# ============================================================

async def _propose(intent: Intent, user_id: str) -> dict:
    """
    Searches for children with urgent medical needs,
    filters for genuine emergencies, and returns the
    top 3 most critical cases for the donor to see.

    Unlike education donation, we do NOT split the amount.
    The full donation goes to one child.
    """

    # ── Step 1: Check amount ──────────────────────────────────
    amount = intent.amount

    if not amount or amount <= 0:
        return {
            "workflow": "emergency_medical",
            "total_amount": 0,
            "cases": [],
            "summary": (
                "I found children who urgently need medical help. "
                "How much would you like to donate? "
                "Even ₹1000 can cover medication for a week."
            ),
            "has_write_action": False,
            "needs_amount": True
        }

    # ── Step 2: Search for children with medical needs ────────
    print(f"[emergency_medical] Searching for medical emergency cases")

    children = await search_children(
        category="medical",
        max_results=10,         # fetch more so filter has enough to work with
        urgent_only=False       # we apply our own urgency filter below
    )

    if not children:
        return {
            "workflow": "emergency_medical",
            "total_amount": amount,
            "cases": [],
            "summary": (
                "I couldn't find any children needing emergency medical support "
                "right now. Please try again later."
            ),
            "has_write_action": False
        }

    # ── Step 3: Filter genuine emergencies ───────────────────
    emergencies = filter_emergency_cases(children)

    if not emergencies:
        # No high-urgency cases — fall back to showing all medical cases
        print(f"[emergency_medical] No high-urgency cases found, "
              f"showing all medical cases")
        emergencies = children

    # ── Step 4: Rank by urgency — most critical first ─────────
    ranked = rank_by_urgency(emergencies)

    # Take top 3 cases to show the donor
    top_cases = ranked[:3]

    print(f"[emergency_medical] Showing {len(top_cases)} emergency cases")

    # ── Step 5: Build case summaries ─────────────────────────
    cases = _build_case_summaries(top_cases, amount)

    # ── Step 6: Build proposal summary ───────────────────────
    summary = _build_proposal_summary(amount, top_cases)

    # ── Step 7: Return proposal ───────────────────────────────
    # Most urgent child is the default selection
    # Frontend can let user pick a different one
    return {
        "workflow": "emergency_medical",
        "total_amount": amount,
        "cases": cases,
        "recommended_child_id": top_cases[0].get("id"),
        "recommended_child_name": top_cases[0].get("name"),
        "summary": summary,
        "has_write_action": True,
        "note": (
            "The full amount will go to one child. "
            "We recommend the most critical case but you can choose."
        )
    }


# ============================================================
# EXECUTE MODE — send full amount to selected child
# Only called after user confirmation.
# ============================================================

async def _execute(intent: Intent, user_id: str, proposal: dict) -> dict:
    """
    Executes the emergency donation to a single child.
    Sends the full amount to the most urgent or selected child.
    Checks if the child becomes fully funded after this donation.
    """

    total_amount = proposal.get("total_amount", 0)
    cases = proposal.get("cases", [])
    transaction_id = None

    # ── Step 1: Find the selected child ──────────────────────
    # Use recommended (most urgent) unless user picked someone else
    selected_id = proposal.get("selected_child_id") or \
                  proposal.get("recommended_child_id")

    # Find the selected child's full data from cases list
    selected_child = None
    for case in cases:
        if case.get("child_id") == selected_id:
            selected_child = case
            break

    # Fallback to first case if selection not found
    if not selected_child and cases:
        selected_child = cases[0]

    if not selected_child:
        return {
            "success": False,
            "impact_summary": (
                "Could not find the selected child. Please try again."
            )
        }

    child_id   = selected_child.get("child_id")
    child_name = selected_child.get("name")
    condition  = selected_child.get("condition", "medical treatment")
    funding_needed   = selected_child.get("funding_needed", 0)
    funding_received = selected_child.get("funding_received", 0)

    print(f"[emergency_medical] Executing donation | "
          f"child={child_name} | ₹{total_amount} | condition={condition}")

    try:
        # ── Step 2: Execute the donation ─────────────────────
        # Full amount goes to this one child
        result = await execute_donation(
            plan={
                "total_amount": total_amount,
                "workflow": "emergency_medical",
                "allocations": [
                    {
                        "child_id": child_id,
                        "child_name": child_name,
                        "allocated_amount": total_amount,
                        "percentage": 100.0
                    }
                ]
            },
            user_id=user_id,
            confirmed=True
        )

        transaction_id = result.get("transaction_id")

        # ── Step 3: Update child's funding status ────────────
        await update_funding_status(
            child_id=child_id,
            amount_added=total_amount,
            transaction_id=transaction_id
        )

        # ── Step 4: Check if child is now fully funded ───────
        new_total_received = funding_received + total_amount
        is_fully_funded = new_total_received >= funding_needed
        remaining_needed = max(0, funding_needed - new_total_received)

        # ── Step 5: Log the donation ─────────────────────────
        await log_donation(
            user_id=user_id,
            workflow="emergency_medical",
            amount=total_amount,
            status="success",
            transaction_id=transaction_id,
            detail={
                "child_id": child_id,
                "child_name": child_name,
                "condition": condition,
                "fully_funded": is_fully_funded
            }
        )

        # ── Step 6: Build impact summary ─────────────────────
        impact_summary = _build_impact_summary(
            amount=total_amount,
            child_name=child_name,
            condition=condition,
            transaction_id=transaction_id,
            is_fully_funded=is_fully_funded,
            remaining_needed=remaining_needed
        )

        # ── Step 7: Return result ─────────────────────────────
        return {
            "success": True,
            "transaction_id": transaction_id,
            "total_amount": total_amount,
            "child_name": child_name,
            "child_id": child_id,
            "condition": condition,
            "fully_funded": is_fully_funded,
            "remaining_needed": remaining_needed,
            "children_helped": 1,
            "impact_summary": impact_summary,
            "workflow": "emergency_medical"
        }

    except Exception as e:
        print(f"[emergency_medical] Execution failed: {e}")

        await log_donation(
            user_id=user_id,
            workflow="emergency_medical",
            amount=total_amount,
            status="failed",
            transaction_id=transaction_id or "unknown",
            detail={"error": str(e), "child_id": child_id}
        )

        return {
            "success": False,
            "impact_summary": (
                "Something went wrong while processing your donation. "
                "No money has been charged. Please try again."
            ),
            "error": str(e)
        }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _build_case_summaries(children: list[dict], amount: float) -> list[dict]:
    """
    Builds clean case summary cards from raw child data.
    Each card has everything the frontend needs to display
    a compelling emergency case to the donor.
    """

    cases = []
    for child in children:
        funding_needed   = float(child.get("funding_needed", 0))
        funding_received = float(child.get("funding_received", 0))
        still_needed     = max(0, funding_needed - funding_received)
        progress_pct     = round((funding_received / funding_needed * 100), 1) \
                           if funding_needed > 0 else 0

        cases.append({
            "child_id":        child.get("id"),
            "name":            child.get("name"),
            "age":             child.get("age"),
            "condition":       _extract_condition(child),
            "location":        child.get("location", "India"),
            "urgency_score":   child.get("urgency_score", 0),
            "story":           child.get("story", ""),
            "funding_needed":  funding_needed,
            "funding_received":funding_received,
            "still_needed":    still_needed,
            "progress_pct":    progress_pct,
            "your_donation_covers": round(
                min(amount / still_needed * 100, 100), 1
            ) if still_needed > 0 else 100
        })

    return cases


def _extract_condition(child: dict) -> str:
    """
    Extracts the medical condition from a child's data.
    Looks in items_needed or story for condition keywords.
    """

    items = child.get("items_needed", [])
    for item in items:
        if any(word in item.lower() for word in
               ["surgery", "treatment", "medication", "operation", "fund"]):
            return item

    # Try to extract from story
    story = child.get("story", "").lower()
    conditions = [
        "heart condition", "surgery", "cancer", "kidney",
        "liver", "brain", "bone", "eye", "ear", "lung"
    ]
    for condition in conditions:
        if condition in story:
            return condition

    return "medical treatment"


def _build_proposal_summary(amount: float, cases: list[dict]) -> str:
    """
    Builds the proposal message shown before confirmation.
    Lists top emergency cases clearly.
    """

    lines = [
        f"I found {len(cases)} children who urgently need medical help.",
        f"Your ₹{amount:,.0f} will go entirely to one child.",
        ""
    ]

    for i, child in enumerate(cases, 1):
        funding_needed   = float(child.get("funding_needed", 0))
        funding_received = float(child.get("funding_received", 0))
        still_needed     = max(0, funding_needed - funding_received)
        urgency          = child.get("urgency_score", 0)
        marker           = "🔴" if urgency >= 0.9 else "🟡"

        lines.append(
            f"{marker} {i}. {child.get('name')} (Age {child.get('age')}) — "
            f"{_extract_condition(child)} — "
            f"Still needs ₹{still_needed:,.0f}"
        )
        lines.append(f"   \"{child.get('story', '')[:80]}...\"")
        lines.append("")

    lines.append(
        f"We recommend donating to {cases[0].get('name')} "
        f"(most critical). Your full ₹{amount:,.0f} will go to them."
    )
    lines.append("Would you like to confirm?")

    return "\n".join(lines)


def _build_impact_summary(
    amount: float,
    child_name: str,
    condition: str,
    transaction_id: str,
    is_fully_funded: bool,
    remaining_needed: float
) -> str:
    """
    Builds the final impact message shown after execution.
    Includes special message if child is now fully funded.
    """

    lines = [
        f"✅ Your donation of ₹{amount:,.0f} has been directed to "
        f"{child_name}'s {condition} fund.",
        f"Transaction ID: {transaction_id}",
        ""
    ]

    if is_fully_funded:
        lines.append(
            f"🎉 Amazing news — {child_name} is now FULLY FUNDED! "
            f"Your donation helped reach the goal. "
            f"The medical team will be notified immediately."
        )
    else:
        lines.append(
            f"{child_name} still needs ₹{remaining_needed:,.0f} more "
            f"to reach their goal. Consider sharing their story "
            f"to help them get fully funded."
        )

    lines.append("")
    lines.append("Thank you for making a difference. You may receive an update on their recovery.")

    return "\n".join(lines)


# ============================================================
# QUICK TEST
# Command: python -m workflows.emergency_medical
# ============================================================

if __name__ == "__main__":
    import asyncio
    from agent.intent_classifier import Intent

    async def run_tests():
        print("=" * 60)
        print("Testing emergency_medical workflow")
        print("=" * 60)

        # Test 1: Propose mode with amount
        print("\n1. Propose mode — ₹10000 emergency donation")
        intent = Intent(
            workflow="emergency_medical",
            amount=10000.0,
            filters={"urgent": True, "category": "medical"},
            raw_message="Help a child who needs urgent surgery, I have ₹10000"
        )
        proposal = await run(intent, user_id="test_user", mode="propose")
        print(f"   Summary: {proposal['summary'][:120]}...")
        print(f"   Cases found: {len(proposal.get('cases', []))}")
        print(f"   Recommended: {proposal.get('recommended_child_name')}")
        for case in proposal.get("cases", []):
            print(f"     {case['name']} | urgency={case['urgency_score']} "
                  f"| needs ₹{case['still_needed']:,.0f} "
                  f"| your donation covers {case['your_donation_covers']}%")

        # Test 2: Propose mode without amount
        print("\n2. Propose mode — no amount mentioned")
        intent2 = Intent(
            workflow="emergency_medical",
            amount=None,
            filters={"urgent": True},
            raw_message="Help a sick child urgently"
        )
        proposal2 = await run(intent2, user_id="test_user", mode="propose")
        print(f"   Response: {proposal2['summary']}")

        # Test 3: Execute mode
        print("\n3. Execute mode — confirming ₹10000 donation")
        result = await run(
            intent=intent,
            user_id="test_user",
            mode="execute",
            proposal=proposal
        )
        print(f"   Success: {result.get('success')}")
        print(f"   Child: {result.get('child_name')}")
        print(f"   Fully funded: {result.get('fully_funded')}")
        print(f"   Impact:\n{result.get('impact_summary')}")

        print("\n" + "=" * 60)
        print("Emergency medical workflow tests complete")
        print("=" * 60)

    asyncio.run(run_tests())
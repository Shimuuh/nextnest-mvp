# ============================================================
# workflows/education_donation.py — Education Donation Workflow
# Handles requests like:
#   "Donate ₹5000 to children who need education support"
#   "Help children get books and uniforms"
#   "I want to fund a child's school fees"
#
# This is the blueprint workflow — all other workflows
# follow the exact same structure as this file.
#
# Two modes:
#   propose → search + rank + allocate (read only)
#   execute → write to DB + return impact summary
# ============================================================

from tools.read_tools import (
    search_children,
    rank_by_urgency,
    calculate_allocation
)
from tools.write_tools import (
    execute_donation,
    update_funding_status,
    log_donation
)
from agent.response_builder import build_impact_summary
from agent.intent_classifier import Intent
from config.settings import EDUCATION_MAX_RESULTS

# ============================================================
# MAIN FUNCTION — called by operator.py
# This is the only function operator.py ever calls.
# ============================================================

async def run(
    intent: Intent,
    user_id: str,
    mode: str,
    proposal: dict = None
) -> dict:
    """
    Main entry point for the education donation workflow.
    Called by operator.py in both propose and execute mode.

    Args:
        intent   : classified intent from intent_classifier.py
                   contains amount, filters, raw_message
        user_id  : platform user making the donation
        mode     : "propose" or "execute"
        proposal : saved proposal from propose mode
                   only passed when mode="execute"

    Returns:
        dict — proposal summary (propose mode)
             — impact result   (execute mode)
    """

    print(f"[education_donation] Running in {mode} mode | "
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
# PROPOSE MODE — read only, builds allocation plan
# No database writes happen here.
# ============================================================

async def _propose(intent: Intent, user_id: str) -> dict:
    """
    Searches for children needing education support,
    ranks them by urgency, and calculates how the
    donation amount will be split across them.

    Returns a proposal dict for the user to review.
    Nothing is written to the database here.
    """

    # ── Step 1: Determine amount ──────────────────────────────
    amount = intent.amount

    # If user didn't mention an amount, ask them
    if not amount or amount <= 0:
        return {
            "workflow": "education_donation",
            "total_amount": 0,
            "allocations": [],
            "summary": (
                "I found children who need education support! "
                "How much would you like to donate? "
                "Even ₹500 can cover a child's books for a month."
            ),
            "has_write_action": False,
            "needs_amount": True    # signal to frontend to ask for amount
        }

    # ── Step 2: Extract filters from intent ──────────────────
    filters = intent.filters or {}
    urgent_only = filters.get("urgent", False)

    # Check if user mentioned a specific item
    # e.g. "books", "uniforms", "school fees"
    specific_item = filters.get("item")

    # ── Step 3: Search for children ──────────────────────────
    print(f"[education_donation] Searching children | "
          f"urgent_only={urgent_only} | item={specific_item}")

    children = await search_children(
        category="education",
        max_results=EDUCATION_MAX_RESULTS * 2,  # fetch extra, we'll trim after ranking
        urgent_only=urgent_only
    )

    if not children:
        return {
            "workflow": "education_donation",
            "total_amount": amount,
            "allocations": [],
            "summary": (
                "I couldn't find any children needing education support right now. "
                "Please try again later or consider a different category."
            ),
            "has_write_action": False
        }

    # ── Step 4: Rank by urgency ───────────────────────────────
    ranked = rank_by_urgency(children)

    # Take top N based on settings
    top_children = ranked[:EDUCATION_MAX_RESULTS]

    print(f"[education_donation] Top {len(top_children)} children selected for allocation")

    # ── Step 5: Calculate allocation ─────────────────────────
    allocations = calculate_allocation(amount, top_children)

    if not allocations:
        return {
            "workflow": "education_donation",
            "total_amount": amount,
            "allocations": [],
            "summary": "Could not calculate allocation. Please try a different amount.",
            "has_write_action": False
        }

    # ── Step 6: Build human-readable summary ─────────────────
    summary = _build_proposal_summary(amount, allocations, specific_item)

    # ── Step 7: Return proposal ───────────────────────────────
    return {
        "workflow": "education_donation",
        "total_amount": amount,
        "allocations": allocations,
        "children_count": len(allocations),
        "summary": summary,
        "has_write_action": True,   # tells operator to ask for confirmation
        "breakdown": _build_breakdown(allocations)
    }


# ============================================================
# EXECUTE MODE — writes to DB, returns impact summary
# Only called after user confirms the proposal.
# ============================================================

async def _execute(intent: Intent, user_id: str, proposal: dict) -> dict:
    """
    Executes the saved donation proposal.
    Writes to the database via write_tools.
    Called only after user confirmation.
    """

    total_amount = proposal.get("total_amount", 0)
    allocations = proposal.get("allocations", [])
    transaction_id = None

    try:
        # ── Step 1: Execute the donation ─────────────────────
        print(f"[education_donation] Executing donation | ₹{total_amount} | "
              f"{len(allocations)} children")

        result = await execute_donation(
            plan=proposal,
            user_id=user_id,
            confirmed=True      # confirmed by operator after user clicked Confirm
        )

        transaction_id = result.get("transaction_id")

        # ── Step 2: Update funding status for each child ─────
        for allocation in allocations:
            child_id = allocation.get("child_id")
            allocated = allocation.get("allocated_amount", 0)

            if child_id and allocated > 0:
                await update_funding_status(
                    child_id=child_id,
                    amount_added=allocated,
                    transaction_id=transaction_id
                )

        # ── Step 3: Log the successful donation ──────────────
        await log_donation(
            user_id=user_id,
            workflow="education_donation",
            amount=total_amount,
            status="success",
            transaction_id=transaction_id,
            detail={
                "children_count": len(allocations),
                "allocations": allocations
            }
        )

        # ── Step 4: Build impact summary ─────────────────────
        child_names = [a["child_name"] for a in allocations[:3]]
        names_str = ", ".join(child_names)
        if len(allocations) > 3:
            names_str += f" and {len(allocations) - 3} more"

        impact_summary = (
            f"✅ Your donation of ₹{total_amount:,.0f} has been processed! "
            f"You are now helping {len(allocations)} "
            f"{'child' if len(allocations) == 1 else 'children'} "
            f"({names_str}) with their education. "
            f"They will receive books, uniforms, and school fee support. "
            f"Transaction ID: {transaction_id}"
        )

        # ── Step 5: Return result ─────────────────────────────
        return {
            "success": True,
            "transaction_id": transaction_id,
            "total_amount": total_amount,
            "children_helped": len(allocations),
            "allocations": allocations,
            "impact_summary": impact_summary,
            "workflow": "education_donation"
        }

    except Exception as e:
        # ── Log failure ───────────────────────────────────────
        print(f"[education_donation] Execution failed: {e}")

        await log_donation(
            user_id=user_id,
            workflow="education_donation",
            amount=total_amount,
            status="failed",
            transaction_id=transaction_id or "unknown",
            detail={"error": str(e)}
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
# Build human-readable text from raw data
# ============================================================

def _build_proposal_summary(
    amount: float,
    allocations: list[dict],
    specific_item: str = None
) -> str:
    """
    Builds the proposal summary shown to the user
    before they confirm the donation.
    """

    count = len(allocations)
    item_text = f" for {specific_item}" if specific_item else ""

    lines = [
        f"Here's how your ₹{amount:,.0f} donation{item_text} will be allocated:",
        ""
    ]

    for i, a in enumerate(allocations, 1):
        items = ", ".join(a.get("items_needed", ["education support"]))
        lines.append(
            f"{i}. {a['child_name']} ({a.get('location', 'India')}) — "
            f"₹{a['allocated_amount']:,.0f} ({a['percentage']}%) — "
            f"Needs: {items}"
        )

    lines.append("")
    lines.append(
        f"Total: ₹{amount:,.0f} helping {count} "
        f"{'child' if count == 1 else 'children'}."
    )
    lines.append("Would you like to confirm this donation?")

    return "\n".join(lines)


def _build_breakdown(allocations: list[dict]) -> list[dict]:
    """
    Builds a clean breakdown list for the frontend
    to display as a table or card list.
    """

    return [
        {
            "child_id": a["child_id"],
            "name": a["child_name"],
            "amount": a["allocated_amount"],
            "percentage": a["percentage"],
            "location": a.get("location", ""),
            "story": a.get("story", ""),
            "items_needed": a.get("items_needed", [])
        }
        for a in allocations
    ]


# ============================================================
# QUICK TEST — run this file directly
# Command: python -m workflows.education_donation
# ============================================================

if __name__ == "__main__":
    import asyncio
    from agent.intent_classifier import Intent

    async def run_tests():
        print("=" * 60)
        print("Testing education_donation workflow")
        print("=" * 60)

        # Test 1: Propose mode with amount
        print("\n1. Propose mode — ₹5000 education donation")
        intent = Intent(
            workflow="education_donation",
            amount=5000.0,
            filters={"category": "education", "urgent": False},
            raw_message="Donate ₹5000 to children who need education support"
        )
        proposal = await run(intent, user_id="test_user", mode="propose")
        print(f"   Summary: {proposal['summary'][:80]}...")
        print(f"   Children: {proposal.get('children_count', 0)}")
        print(f"   Allocations:")
        for a in proposal.get("allocations", []):
            print(f"     {a['child_name']} → ₹{a['allocated_amount']} ({a['percentage']}%)")

        # Test 2: Propose mode without amount
        print("\n2. Propose mode — no amount mentioned")
        intent2 = Intent(
            workflow="education_donation",
            amount=None,
            filters={},
            raw_message="I want to help children with education"
        )
        proposal2 = await run(intent2, user_id="test_user", mode="propose")
        print(f"   Response: {proposal2['summary']}")

        # Test 3: Execute mode with saved proposal
        print("\n3. Execute mode — confirming ₹5000 donation")
        result = await run(
            intent=intent,
            user_id="test_user",
            mode="execute",
            proposal=proposal
        )
        print(f"   Success: {result.get('success')}")
        print(f"   Impact: {result.get('impact_summary')}")
        print(f"   Transaction: {result.get('transaction_id')}")

        print("\n" + "=" * 60)
        print("Education donation workflow tests complete")
        print("=" * 60)

    asyncio.run(run_tests())
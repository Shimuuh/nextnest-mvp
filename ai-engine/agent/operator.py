# ============================================================
# agent/operator.py — The Central Brain
# This is the file that main.py calls for every user request.
# It connects intent_classifier → workflows → response_builder
#
# Responsibilities:
#   1. Receive user request from main.py
#   2. Classify intent using intent_classifier.py
#   3. Handle clarification if message is too vague
#   4. Route to the correct workflow
#   5. Enforce confirmation gate before any writes
#   6. Return structured response to main.py
# ============================================================

from agent.intent_classifier import classify, Intent
from agent.response_builder import build_response, build_clarification, build_error
from config.settings import ALWAYS_CONFIRM_ABOVE, MAX_DONATION_AMOUNT
from memory.user_context import get_session, update_session

# Import all 4 workflows
from workflows.education_donation import run as run_education
from workflows.emergency_medical import run as run_emergency
from workflows.orphanage_supply import run as run_supply
from workflows.child_sponsorship import run as run_sponsorship

# ============================================================
# REQUEST / RESPONSE MODELS
# Mirrors the models in main.py — kept here too for clarity
# ============================================================

from pydantic import BaseModel
from typing import Optional

class UserRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    confirmation: bool = False

# ============================================================
# WORKFLOW REGISTRY
# Maps intent workflow IDs to their run functions.
# To add a new workflow: add one line here + create the file.
# ============================================================

WORKFLOW_REGISTRY = {
    "education_donation": run_education,
    "emergency_medical":  run_emergency,
    "orphanage_supply":   run_supply,
    "child_sponsorship":  run_sponsorship,
}

# ============================================================
# MAIN FUNCTION — called by main.py for every request
# ============================================================

async def handle_request(request: UserRequest) -> dict:
    """
    Central handler. Called by main.py for every user message.

    Two-pass flow:
      Pass 1 (confirmation=False):
        - Classify intent
        - Run workflow in PROPOSE mode
        - Return proposal to user for review
        - Set requires_confirmation=True

      Pass 2 (confirmation=True):
        - Retrieve saved proposal from session memory
        - Run workflow in EXECUTE mode
        - Return final result and impact summary

    Args:
        request : UserRequest from main.py

    Returns:
        dict matching AgentResponse model in main.py
    """

    try:

        # ── PASS 2: User has confirmed — execute saved proposal ──
        if request.confirmation:
            return await _execute_confirmed(request)

        # ── PASS 1: New message — classify and propose ───────────
        return await _classify_and_propose(request)

    except Exception as e:
        # Catch all unexpected errors and return clean response
        print(f"[operator] Unexpected error: {e}")
        return build_error(
            message="Something went wrong in the AI engine. Please try again.",
            detail=str(e)
        )


# ============================================================
# PASS 1 — Classify intent and return a proposal
# ============================================================

async def _classify_and_propose(request: UserRequest) -> dict:
    """
    Classifies the user's message and runs the workflow
    in propose mode. Returns a plan for user to review.
    Does NOT write anything to the database.
    """

    # Step 1: Classify the intent
    intent: Intent = await classify(request.message, request.session_id)

    print(f"[operator] Intent classified: {intent.workflow} "
          f"(confidence={intent.confidence}, amount=₹{intent.amount})")

    # Step 2: If message is too vague, ask for clarification
    if intent.needs_clarification:
        return build_clarification(intent.clarification_question)

    # Step 3: Safety check — amount exceeds platform limit
    if intent.amount and intent.amount > MAX_DONATION_AMOUNT:
        return build_error(
            message=f"The amount ₹{intent.amount:,.0f} exceeds our single-transaction "
                    f"limit of ₹{MAX_DONATION_AMOUNT:,.0f}. "
                    f"Please contact us directly for large donations."
        )

    # Step 4: Find the correct workflow
    workflow_fn = WORKFLOW_REGISTRY.get(intent.workflow)
    if not workflow_fn:
        return build_error(
            message=f"I understood your request but couldn't find the right workflow. "
                    f"Please try rephrasing."
        )

    # Step 5: Run workflow in PROPOSE mode (read-only, no DB writes)
    proposal = await workflow_fn(
        intent=intent,
        user_id=request.user_id,
        mode="propose"              # propose = search + rank only, no execution
    )

    # Step 6: Save proposal to session so Pass 2 can execute it
    await update_session(request.session_id, {
        "pending_proposal": proposal,
        "pending_intent": intent.dict(),
        "user_id": request.user_id
    })

    # Step 7: Decide if confirmation is needed
    # Always confirm if: amount > threshold OR workflow involves writes
    needs_confirm = (
        intent.amount is not None and intent.amount >= ALWAYS_CONFIRM_ABOVE
    ) or proposal.get("has_write_action", True)

    return build_response(
        status="proposal",
        message=proposal.get("summary", "Here is what I found:"),
        workflow=intent.workflow,
        proposal=proposal,
        result=None,
        requires_confirmation=needs_confirm
    )


# ============================================================
# PASS 2 — Execute the confirmed proposal
# ============================================================

async def _execute_confirmed(request: UserRequest) -> dict:
    """
    Retrieves the saved proposal from session memory and
    executes it. This is the only place DB writes happen.
    """

    # Step 1: Retrieve saved proposal from session
    session = await get_session(request.session_id)

    if not session or "pending_proposal" not in session:
        # No pending proposal found — user may have waited too long
        # or session expired
        return build_error(
            message="I couldn't find your previous request. "
                    "Your session may have expired. "
                    "Please describe what you'd like to do again."
        )

    proposal = session["pending_proposal"]
    intent_data = session["pending_intent"]

    # Reconstruct intent from saved dict
    intent = Intent(**intent_data)

    print(f"[operator] Executing confirmed proposal for workflow: {intent.workflow}")

    # Step 2: Find workflow
    workflow_fn = WORKFLOW_REGISTRY.get(intent.workflow)
    if not workflow_fn:
        return build_error(message="Workflow not found during execution.")

    # Step 3: Run workflow in EXECUTE mode (DB writes happen here)
    result = await workflow_fn(
        intent=intent,
        user_id=request.user_id,
        mode="execute",             # execute = actually write to DB
        proposal=proposal           # pass saved proposal so workflow knows what to execute
    )

    # Step 4: Clear the pending proposal from session
    await update_session(request.session_id, {
        "pending_proposal": None,
        "pending_intent": None,
        "last_completed": intent.workflow
    })

    # Step 5: Return final result with impact summary
    return build_response(
        status="executed",
        message=result.get("impact_summary", "Your donation has been processed successfully!"),
        workflow=intent.workflow,
        proposal=None,              # no longer needed
        result=result,
        requires_confirmation=False
    )
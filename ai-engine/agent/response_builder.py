# ============================================================
# agent/response_builder.py — Formats responses for Node.js
# operator.py calls these functions to build every response.
# All responses follow the same structure so Node.js always
# knows what to expect regardless of which workflow ran.
# ============================================================

from typing import Optional

# ============================================================
# STANDARD RESPONSE BUILDER
# Used for both proposals and executed results
# ============================================================

def build_response(
    status: str,
    message: str,
    workflow: Optional[str] = None,
    proposal: Optional[dict] = None,
    result: Optional[dict] = None,
    requires_confirmation: bool = False
) -> dict:
    """
    Builds a standard response for any workflow outcome.

    Args:
        status               : "proposal" | "executed" | "error" | "clarification"
        message              : human-readable text to show the user
        workflow             : which workflow ran e.g. "education_donation"
        proposal             : the plan shown BEFORE confirmation (Pass 1)
        result               : the outcome AFTER execution (Pass 2)
        requires_confirmation: True = frontend should show a Confirm button

    Returns:
        dict matching AgentResponse model in main.py
    """

    return {
        "status": status,
        "message": message,
        "workflow": workflow,
        "proposal": proposal,
        "result": result,
        "requires_confirmation": requires_confirmation
    }


# ============================================================
# CLARIFICATION RESPONSE
# Used when user's message is too vague to act on
# ============================================================

def build_clarification(question: str) -> dict:
    """
    Returns a response asking the user for more information.
    No workflow runs, no DB reads or writes.

    Args:
        question : the clarification question to show the user

    Example:
        build_clarification(
            "Would you like to donate money, sponsor a child,
             or send supplies to an orphanage?"
        )
    """

    return {
        "status": "clarification",
        "message": question,
        "workflow": None,
        "proposal": None,
        "result": None,
        "requires_confirmation": False
    }


# ============================================================
# ERROR RESPONSE
# Used when something goes wrong at any stage
# ============================================================

def build_error(message: str, detail: str = "") -> dict:
    """
    Returns a clean error response to Node.js.
    Never exposes raw Python tracebacks to the frontend.

    Args:
        message : friendly error message to show the user
        detail  : technical detail for logging (not shown to user)

    Example:
        build_error("Amount exceeds limit of ₹50,000")
    """

    if detail:
        print(f"[response_builder] Error detail: {detail}")

    return {
        "status": "error",
        "message": message,
        "workflow": None,
        "proposal": None,
        "result": None,
        "requires_confirmation": False
    }


# ============================================================
# IMPACT SUMMARY BUILDER
# Workflows call this to format their final impact message
# ============================================================

def build_impact_summary(workflow: str, result: dict) -> str:
    """
    Builds a human-readable impact summary from workflow results.
    Called by workflows after successful execution.

    Args:
        workflow : which workflow ran
        result   : raw result dict from the workflow

    Returns:
        A friendly string summarizing the impact
    """

    if workflow == "education_donation":
        count = result.get("children_helped", 0)
        amount = result.get("total_amount", 0)
        return (
            f"✅ Your donation of ₹{amount:,.0f} has been allocated to "
            f"{count} {'child' if count == 1 else 'children'} needing education support. "
            f"You're helping them access books, uniforms, and school fees!"
        )

    elif workflow == "emergency_medical":
        name = result.get("child_name", "a child")
        amount = result.get("total_amount", 0)
        condition = result.get("condition", "medical treatment")
        return (
            f"✅ Your donation of ₹{amount:,.0f} has been directed to "
            f"{name}'s {condition} fund. "
            f"Your support could be life-changing!"
        )

    elif workflow == "orphanage_supply":
        orphanage = result.get("orphanage_name", "the orphanage")
        items = result.get("items_sent", [])
        items_str = ", ".join(items) if items else "supplies"
        return (
            f"✅ {items_str.capitalize()} have been arranged for "
            f"{orphanage}. "
            f"The children will receive these soon!"
        )

    elif workflow == "child_sponsorship":
        name = result.get("child_name", "a child")
        amount = result.get("monthly_amount", 0)
        return (
            f"✅ You are now sponsoring {name} with ₹{amount:,.0f}/month. "
            f"Your support covers their education and daily needs. "
            f"You'll receive monthly updates on their progress!"
        )

    else:
        amount = result.get("total_amount", 0)
        return f"✅ Your contribution of ₹{amount:,.0f} has been processed successfully. Thank you!"
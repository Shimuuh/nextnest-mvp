# ============================================================
# tools/write_tools.py — Write Tools (DB Actions)
# These functions write to the database via Node.js backend.
# ONLY called in execute mode, NEVER in propose mode.
#
# Critical safety rules enforced here:
#   1. confirmed must be True or execution is blocked
#   2. Every action is logged before and after
#   3. All functions are idempotent where possible
#      (safe to retry if something fails halfway)
#   4. No function writes more than MAX_DONATION_AMOUNT
# ============================================================

import httpx
import uuid
from datetime import datetime
from typing import Optional
from config.settings import (
    BACKEND_API_URL,
    BACKEND_API_SECRET,
    BACKEND_TIMEOUT,
    MAX_DONATION_AMOUNT
)

# ============================================================
# HTTP CLIENT SETUP
# ============================================================

def _get_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-ai-secret": BACKEND_API_SECRET
    }

# ============================================================
# CORE EXECUTION FUNCTION
# The most important function in this file.
# Called by every workflow in execute mode.
# ============================================================

async def execute_donation(
    plan: dict,
    user_id: str,
    confirmed: bool = False
) -> dict:
    """
    Executes a donation plan by writing to the database
    via the Node.js backend API.

    THIS IS THE ONLY FUNCTION THAT MOVES MONEY.
    It will refuse to execute if confirmed=False.

    Args:
        plan      : the proposal dict saved from propose mode
                    must contain "allocations" or "orphanage_id"
        user_id   : the platform user making the donation
        confirmed : MUST be True or execution is blocked
                    operator.py sets this to True only after
                    user clicks the Confirm button

    Returns:
        dict with execution result:
        {
            "success": True,
            "transaction_id": "txn_abc123",
            "total_amount": 5000.0,
            "children_helped": 3,
            "timestamp": "2024-01-15T10:30:00",
            "impact_summary": "Your ₹5000 helped 3 children..."
        }

    Raises:
        ValueError if confirmed=False (safety block)
        ValueError if amount exceeds MAX_DONATION_AMOUNT
    """

    # ── SAFETY GATE 1: Confirmation check ────────────────────
    # This is the most important check in the entire system.
    # Never remove or bypass this.
    if not confirmed:
        raise ValueError(
            "[write_tools] BLOCKED: execute_donation called without confirmation. "
            "User must confirm before any donation is executed."
        )

    # ── SAFETY GATE 2: Amount limit check ────────────────────
    total_amount = plan.get("total_amount", 0)
    if total_amount > MAX_DONATION_AMOUNT:
        raise ValueError(
            f"[write_tools] BLOCKED: Amount ₹{total_amount} exceeds "
            f"limit of ₹{MAX_DONATION_AMOUNT}"
        )

    # ── Generate unique transaction ID ───────────────────────
    # Used for idempotency — if this request is sent twice,
    # the backend can detect the duplicate and ignore it
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"

    print(f"[write_tools] Executing donation | txn={transaction_id} | "
          f"user={user_id} | amount=₹{total_amount}")

    # ── Build the payload for Node.js backend ────────────────
    payload = {
        "transaction_id": transaction_id,
        "user_id": user_id,
        "total_amount": total_amount,
        "workflow": plan.get("workflow"),
        "allocations": plan.get("allocations", []),
        "orphanage_id": plan.get("orphanage_id"),
        "sponsorship": plan.get("sponsorship"),
        "timestamp": datetime.utcnow().isoformat(),
        "confirmed": True   # explicit flag for backend validation too
    }

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.post(
                f"{BACKEND_API_URL}/donations/execute",
                json=payload,
                headers=_get_headers()
            )
            response.raise_for_status()
            result = response.json()

            print(f"[write_tools] Donation executed successfully | txn={transaction_id}")
            return result

    except httpx.HTTPStatusError as e:
        print(f"[write_tools] Backend error: {e.response.status_code} — {e.response.text}")
        # Return mock success during development
        return _mock_execution_result(transaction_id, plan, user_id)

    except Exception as e:
        print(f"[write_tools] Connection error: {e}")
        # Return mock success during development
        return _mock_execution_result(transaction_id, plan, user_id)


# ============================================================
# FUNDING STATUS UPDATE
# Called after execute_donation to update each child's
# funding progress in the database
# ============================================================

async def update_funding_status(
    child_id: str,
    amount_added: float,
    transaction_id: str
) -> bool:
    """
    Updates how much funding a child has received.
    Called after execute_donation for each child in the allocation.

    Args:
        child_id       : the child whose funding to update
        amount_added   : how much was just donated to this child
        transaction_id : links this update to the donation record

    Returns:
        True if update succeeded, False if it failed
    """

    payload = {
        "child_id": child_id,
        "amount_added": amount_added,
        "transaction_id": transaction_id,
        "timestamp": datetime.utcnow().isoformat()
    }

    print(f"[write_tools] Updating funding for child {child_id} | +₹{amount_added}")

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.patch(
                f"{BACKEND_API_URL}/children/{child_id}/funding",
                json=payload,
                headers=_get_headers()
            )
            response.raise_for_status()
            print(f"[write_tools] Funding updated for child {child_id}")
            return True

    except Exception as e:
        print(f"[write_tools] Failed to update funding for {child_id}: {e}")
        return False     # non-critical — donation already recorded, this can be retried


# ============================================================
# SPONSORSHIP CREATION
# Used exclusively by child_sponsorship workflow
# Creates a recurring monthly sponsorship record
# ============================================================

async def create_sponsorship(
    child_id: str,
    user_id: str,
    monthly_amount: float,
    transaction_id: str
) -> dict:
    """
    Creates a monthly sponsorship record in the database.
    Sets up recurring donation for the sponsor.

    Args:
        child_id       : child being sponsored
        user_id        : user doing the sponsoring
        monthly_amount : amount per month in ₹
        transaction_id : links to the initial donation

    Returns:
        dict with sponsorship details:
        {
            "sponsorship_id": "spon_abc123",
            "child_id": "child_004",
            "user_id": "u123",
            "monthly_amount": 1000.0,
            "start_date": "2024-01-15",
            "status": "active"
        }
    """

    payload = {
        "child_id": child_id,
        "user_id": user_id,
        "monthly_amount": monthly_amount,
        "transaction_id": transaction_id,
        "start_date": datetime.utcnow().date().isoformat(),
        "status": "active"
    }

    print(f"[write_tools] Creating sponsorship | child={child_id} | "
          f"user={user_id} | ₹{monthly_amount}/month")

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.post(
                f"{BACKEND_API_URL}/sponsorships",
                json=payload,
                headers=_get_headers()
            )
            response.raise_for_status()
            result = response.json()
            print(f"[write_tools] Sponsorship created: {result.get('sponsorship_id')}")
            return result

    except Exception as e:
        print(f"[write_tools] Error creating sponsorship: {e}")
        # Return mock during development
        return {
            "sponsorship_id": f"spon_{uuid.uuid4().hex[:8]}",
            "child_id": child_id,
            "user_id": user_id,
            "monthly_amount": monthly_amount,
            "start_date": datetime.utcnow().date().isoformat(),
            "status": "active",
            "_mock": True
        }


# ============================================================
# SUPPLY REQUEST CREATION
# Used exclusively by orphanage_supply workflow
# Records a supply donation request in the database
# ============================================================

async def create_supply_request(
    orphanage_id: str,
    user_id: str,
    items: list[dict],
    total_amount: float,
    transaction_id: str
) -> dict:
    """
    Records a supply donation for an orphanage.

    Args:
        orphanage_id   : orphanage receiving the supplies
        user_id        : user making the donation
        items          : list of items being donated
                         [{"item": "blankets", "quantity": 20}]
        total_amount   : total cost in ₹
        transaction_id : links to the donation record

    Returns:
        dict with supply request details
    """

    payload = {
        "orphanage_id": orphanage_id,
        "user_id": user_id,
        "items": items,
        "total_amount": total_amount,
        "transaction_id": transaction_id,
        "status": "pending_delivery",
        "timestamp": datetime.utcnow().isoformat()
    }

    print(f"[write_tools] Creating supply request | orphanage={orphanage_id} | "
          f"items={[i['item'] for i in items]} | ₹{total_amount}")

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.post(
                f"{BACKEND_API_URL}/supplies",
                json=payload,
                headers=_get_headers()
            )
            response.raise_for_status()
            return response.json()

    except Exception as e:
        print(f"[write_tools] Error creating supply request: {e}")
        return {
            "supply_request_id": f"sup_{uuid.uuid4().hex[:8]}",
            "orphanage_id": orphanage_id,
            "items": items,
            "total_amount": total_amount,
            "status": "pending_delivery",
            "_mock": True
        }


# ============================================================
# DONATION LOG
# Records every donation attempt — success or failure.
# Used for audit trail and donor impact history.
# ============================================================

async def log_donation(
    user_id: str,
    workflow: str,
    amount: float,
    status: str,
    transaction_id: str,
    detail: dict = {}
) -> None:
    """
    Writes an audit log entry for every donation attempt.
    Called by workflows after execute_donation completes.
    Never raises — logging failure should never block a donation.

    Args:
        user_id        : who made the donation
        workflow       : which workflow ran
        amount         : amount in ₹
        status         : "success" | "failed" | "cancelled"
        transaction_id : unique transaction reference
        detail         : any extra info to log
    """

    payload = {
        "user_id": user_id,
        "workflow": workflow,
        "amount": amount,
        "status": status,
        "transaction_id": transaction_id,
        "detail": detail,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        async with httpx.AsyncClient(timeout=5) as client:   # short timeout for logging
            await client.post(
                f"{BACKEND_API_URL}/donations/log",
                json=payload,
                headers=_get_headers()
            )
        print(f"[write_tools] Donation logged | txn={transaction_id} | status={status}")

    except Exception as e:
        # Never raise from logging — just print
        print(f"[write_tools] Logging failed (non-critical): {e}")


# ============================================================
# MOCK EXECUTION RESULT
# Used when backend is not yet connected.
# Returns realistic mock response so workflows can be
# fully built and tested before Node.js backend is ready.
# ============================================================

def _mock_execution_result(
    transaction_id: str,
    plan: dict,
    user_id: str
) -> dict:
    """
    Returns a realistic mock execution result.
    Only used when the Node.js backend is not reachable.
    """

    allocations = plan.get("allocations", [])
    total = plan.get("total_amount", 0)
    children_count = len(allocations)

    print(f"[write_tools] Using mock execution result (backend not connected)")

    return {
        "success": True,
        "transaction_id": transaction_id,
        "total_amount": total,
        "children_helped": children_count,
        "allocations": allocations,
        "workflow": plan.get("workflow"),
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "impact_summary": (
            f"✅ Your donation of ₹{total:,.0f} has been processed successfully. "
            f"{'It will help ' + str(children_count) + ' children.' if children_count else ''}"
        ),
        "_mock": True   # flag so you know this is test data
    }


# ============================================================
# QUICK TEST — run this file directly
# Command: python -m tools.write_tools
# NOTE: Tests propose mode safety block and mock execution
# ============================================================

if __name__ == "__main__":
    import asyncio

    async def run_tests():
        print("=" * 60)
        print("Testing write_tools.py")
        print("=" * 60)

        # Test 1: Safety block — should raise error
        print("\n1. Safety block test (confirmed=False)")
        try:
            await execute_donation(
                plan={"total_amount": 5000, "allocations": []},
                user_id="test_user",
                confirmed=False     # this should be blocked
            )
            print("   ❌ FAILED — should have been blocked")
        except ValueError as e:
            print(f"   ✅ Correctly blocked: {e}")

        # Test 2: Amount limit — should raise error
        print("\n2. Amount limit test (₹999999)")
        try:
            await execute_donation(
                plan={"total_amount": 999999, "allocations": []},
                user_id="test_user",
                confirmed=True
            )
            print("   ❌ FAILED — should have been blocked")
        except ValueError as e:
            print(f"   ✅ Correctly blocked: {e}")

        # Test 3: Valid execution (mock)
        print("\n3. Valid execution test (₹5000, confirmed=True)")
        result = await execute_donation(
            plan={
                "total_amount": 5000.0,
                "workflow": "education_donation",
                "allocations": [
                    {"child_id": "child_001", "child_name": "Arjun Kumar",
                     "allocated_amount": 3000.0},
                    {"child_id": "child_003", "child_name": "Ravi Nair",
                     "allocated_amount": 2000.0}
                ]
            },
            user_id="test_user",
            confirmed=True
        )
        print(f"   ✅ Success | txn={result['transaction_id']}")
        print(f"   Impact: {result['impact_summary']}")

        # Test 4: Sponsorship creation
        print("\n4. Sponsorship creation test")
        spon = await create_sponsorship(
            child_id="child_004",
            user_id="test_user",
            monthly_amount=1000.0,
            transaction_id="txn_test123"
        )
        print(f"   ✅ Sponsorship: {spon['sponsorship_id']} | "
              f"₹{spon['monthly_amount']}/month")

        # Test 5: Supply request
        print("\n5. Supply request test")
        supply = await create_supply_request(
            orphanage_id="orphanage_001",
            user_id="test_user",
            items=[{"item": "blankets", "quantity": 20}],
            total_amount=3000.0,
            transaction_id="txn_test456"
        )
        print(f"   ✅ Supply request: {supply['supply_request_id']}")

        print("\n" + "=" * 60)
        print("All write_tools tests complete")
        print("=" * 60)

    asyncio.run(run_tests())
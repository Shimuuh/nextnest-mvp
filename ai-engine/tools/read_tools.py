# ============================================================
# tools/read_tools.py — Read-Only Data Tools
# These functions search, filter, and rank data.
# ZERO side effects — nothing is written to the database here.
# Workflows call these freely in both propose and execute mode.
#
# All functions call your Node.js backend API to get data.
# The AI engine never connects to the database directly.
# ============================================================

import httpx
from typing import Optional
from config.settings import (
    BACKEND_API_URL,
    BACKEND_API_SECRET,
    BACKEND_TIMEOUT,
    EDUCATION_MAX_RESULTS,
    SUPPLY_MAX_ORPHANAGES,
    EMERGENCY_URGENCY_THRESHOLD
)

# ============================================================
# HTTP CLIENT SETUP
# All requests to Node.js backend use these headers.
# The secret key proves the request came from the AI engine.
# ============================================================

def _get_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-ai-secret": BACKEND_API_SECRET   # Node.js validates this
    }

# ============================================================
# CHILD SEARCH FUNCTIONS
# ============================================================

async def search_children(
    category: Optional[str] = None,
    max_results: int = EDUCATION_MAX_RESULTS,
    urgent_only: bool = False,
    min_funding_needed: Optional[float] = None
) -> list[dict]:
    """
    Searches for children matching the given filters.
    Calls GET /api/children on the Node.js backend.

    Args:
        category          : "education" | "medical" | "sponsorship" | None (all)
        max_results       : how many results to return (default from settings)
        urgent_only       : if True, only return children marked urgent
        min_funding_needed: only return children who need at least this amount

    Returns:
        list of child dicts, each containing:
        {
            "id": "child_123",
            "name": "Arjun",
            "age": 10,
            "category": "education",
            "funding_needed": 5000.0,
            "funding_received": 1200.0,
            "urgency_score": 0.85,      # 0.0 to 1.0
            "urgent": True,
            "story": "Arjun lost his father and needs...",
            "location": "Mumbai",
            "items_needed": ["books", "uniform"]
        }

    Example:
        children = await search_children(category="education", urgent_only=True)
    """

    params = {
        "max_results": max_results
    }

    if category:
        params["category"] = category
    if urgent_only:
        params["urgent"] = "true"
    if min_funding_needed:
        params["min_funding_needed"] = min_funding_needed

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.get(
                f"{BACKEND_API_URL}/children",
                params=params,
                headers=_get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"[read_tools] search_children returned {len(data)} results")
            return data

    except httpx.HTTPStatusError as e:
        print(f"[read_tools] Backend error in search_children: {e}")
        return _mock_children(category, max_results)   # fallback to mock data

    except Exception as e:
        print(f"[read_tools] Connection error in search_children: {e}")
        return _mock_children(category, max_results)   # fallback to mock data


async def search_child_by_id(child_id: str) -> Optional[dict]:
    """
    Fetches a single child's full profile by ID.
    Used by child_sponsorship workflow to get detailed info.

    Args:
        child_id : unique ID of the child

    Returns:
        child dict or None if not found
    """

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.get(
                f"{BACKEND_API_URL}/children/{child_id}",
                headers=_get_headers()
            )
            response.raise_for_status()
            return response.json()

    except Exception as e:
        print(f"[read_tools] Error fetching child {child_id}: {e}")
        return None


# ============================================================
# ORPHANAGE SEARCH FUNCTIONS
# ============================================================

async def search_orphanages(
    supply_type: Optional[str] = None,
    urgent_only: bool = False,
    max_results: int = SUPPLY_MAX_ORPHANAGES
) -> list[dict]:
    """
    Searches for orphanages that need supplies.
    Calls GET /api/orphanages on the Node.js backend.

    Args:
        supply_type  : "blankets" | "food" | "books" | "uniforms" | None (any)
        urgent_only  : if True, only return orphanages with urgent needs
        max_results  : how many results to return

    Returns:
        list of orphanage dicts, each containing:
        {
            "id": "orphanage_001",
            "name": "Sunshine Children's Home",
            "location": "Delhi",
            "urgency_score": 0.9,
            "urgent": True,
            "children_count": 45,
            "supplies_needed": [
                {"item": "blankets", "quantity": 50, "estimated_cost": 7500},
                {"item": "books",    "quantity": 30, "estimated_cost": 3000}
            ],
            "contact": "sunshine@example.com",
            "verified": True
        }

    Example:
        orphanages = await search_orphanages(supply_type="blankets", urgent_only=True)
    """

    params = {"max_results": max_results}

    if supply_type:
        params["supply_type"] = supply_type
    if urgent_only:
        params["urgent"] = "true"

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.get(
                f"{BACKEND_API_URL}/orphanages",
                params=params,
                headers=_get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"[read_tools] search_orphanages returned {len(data)} results")
            return data

    except Exception as e:
        print(f"[read_tools] Error in search_orphanages: {e}")
        return _mock_orphanages(supply_type, max_results)


# ============================================================
# RANKING FUNCTION
# ============================================================

def rank_by_urgency(items: list[dict]) -> list[dict]:
    """
    Sorts a list of children or orphanages by urgency score.
    Highest urgency first.

    Works with both child dicts and orphanage dicts —
    both have an "urgency_score" field.

    Args:
        items : list of child or orphanage dicts

    Returns:
        same list sorted by urgency_score descending

    Example:
        ranked = rank_by_urgency(children)
        # ranked[0] is now the most urgent child
    """

    if not items:
        return []

    ranked = sorted(
        items,
        key=lambda x: float(x.get("urgency_score", 0)),
        reverse=True    # highest urgency first
    )

    print(f"[read_tools] rank_by_urgency: sorted {len(ranked)} items")
    return ranked


# ============================================================
# ALLOCATION CALCULATOR
# ============================================================

def calculate_allocation(
    amount: float,
    recipients: list[dict]
) -> list[dict]:
    """
    Splits a donation amount across multiple recipients
    proportionally based on their funding_needed.

    Children who need more get a larger share.
    No child receives more than they need.

    Args:
        amount     : total donation amount in ₹
        recipients : list of child dicts with "funding_needed" field

    Returns:
        list of allocation dicts:
        [
            {
                "child_id": "child_123",
                "child_name": "Arjun",
                "allocated_amount": 2500.0,
                "funding_needed": 5000.0,
                "percentage": 50.0
            },
            ...
        ]

    Example:
        allocations = calculate_allocation(5000.0, ranked_children)
    """

    if not recipients or amount <= 0:
        return []

    # Calculate total funding needed across all recipients
    total_needed = sum(
        float(r.get("funding_needed", 0) - r.get("funding_received", 0))
        for r in recipients
    )

    if total_needed <= 0:
        return []

    allocations = []
    remaining = amount

    for i, recipient in enumerate(recipients):
        needed = float(
            recipient.get("funding_needed", 0) -
            recipient.get("funding_received", 0)
        )

        if needed <= 0:
            continue

        # Last recipient gets whatever is remaining (avoids rounding errors)
        if i == len(recipients) - 1:
            allocated = min(remaining, needed)
        else:
            # Proportional share based on how much they need
            proportion = needed / total_needed
            allocated = round(min(amount * proportion, needed), 2)

        remaining -= allocated

        allocations.append({
            "child_id": recipient.get("id"),
            "child_name": recipient.get("name", "Unknown"),
            "allocated_amount": allocated,
            "funding_needed": needed,
            "funding_received": recipient.get("funding_received", 0),
            "percentage": round((allocated / amount) * 100, 1),
            "story": recipient.get("story", ""),
            "location": recipient.get("location", ""),
            "items_needed": recipient.get("items_needed", [])
        })

        if remaining <= 0:
            break

    print(f"[read_tools] calculate_allocation: ₹{amount} split across {len(allocations)} recipients")
    return allocations


# ============================================================
# EMERGENCY FILTER
# ============================================================

def filter_emergency_cases(children: list[dict]) -> list[dict]:
    """
    Filters children to only return genuine emergency cases.
    Uses EMERGENCY_URGENCY_THRESHOLD from settings.

    Args:
        children : list of child dicts

    Returns:
        only children with urgency_score above threshold
    """

    emergency = [
        c for c in children
        if float(c.get("urgency_score", 0)) >= EMERGENCY_URGENCY_THRESHOLD
    ]

    print(f"[read_tools] filter_emergency_cases: {len(emergency)}/{len(children)} qualify")
    return emergency


# ============================================================
# FUNDING STATUS CHECK
# ============================================================

async def get_funding_status(child_id: str) -> Optional[dict]:
    """
    Gets the current funding status for a child.
    Used to check if a child still needs funding before executing.

    Args:
        child_id : unique ID of the child

    Returns:
        {
            "child_id": "child_123",
            "funding_needed": 5000.0,
            "funding_received": 1200.0,
            "funding_remaining": 3800.0,
            "fully_funded": False
        }
    """

    try:
        async with httpx.AsyncClient(timeout=BACKEND_TIMEOUT) as client:
            response = await client.get(
                f"{BACKEND_API_URL}/children/{child_id}/funding",
                headers=_get_headers()
            )
            response.raise_for_status()
            return response.json()

    except Exception as e:
        print(f"[read_tools] Error fetching funding status for {child_id}: {e}")
        return None


# ============================================================
# MOCK DATA — used when backend is not yet connected
# Lets you build and test all workflows before the
# Node.js backend and database are ready
# ============================================================

def _mock_children(category: Optional[str], max_results: int) -> list[dict]:
    """Returns realistic mock children for testing without a backend."""

    mock = [
        {
            "id": "child_001",
            "name": "Arjun Kumar",
            "age": 10,
            "category": "education",
            "funding_needed": 8000.0,
            "funding_received": 2000.0,
            "urgency_score": 0.9,
            "urgent": True,
            "story": "Arjun lost his father last year. He is a bright student but cannot afford books and school fees.",
            "location": "Mumbai",
            "items_needed": ["books", "uniform", "school fees"]
        },
        {
            "id": "child_002",
            "name": "Priya Sharma",
            "age": 8,
            "category": "medical",
            "funding_needed": 25000.0,
            "funding_received": 5000.0,
            "urgency_score": 0.95,
            "urgent": True,
            "story": "Priya has been diagnosed with a heart condition and needs surgery within 3 months.",
            "location": "Delhi",
            "items_needed": ["surgery fund", "medication"]
        },
        {
            "id": "child_003",
            "name": "Ravi Nair",
            "age": 12,
            "category": "education",
            "funding_needed": 6000.0,
            "funding_received": 1000.0,
            "urgency_score": 0.75,
            "urgent": False,
            "story": "Ravi is a talented artist who wants to continue school but his family struggles to pay fees.",
            "location": "Chennai",
            "items_needed": ["school fees", "art supplies"]
        },
        {
            "id": "child_004",
            "name": "Fatima Shaikh",
            "age": 9,
            "category": "sponsorship",
            "funding_needed": 1500.0,
            "funding_received": 0.0,
            "urgency_score": 0.8,
            "urgent": True,
            "story": "Fatima lives in an orphanage and needs monthly support for education and meals.",
            "location": "Hyderabad",
            "items_needed": ["monthly meals", "school fees", "clothing"]
        },
        {
            "id": "child_005",
            "name": "Suresh Patel",
            "age": 11,
            "category": "education",
            "funding_needed": 4500.0,
            "funding_received": 500.0,
            "urgency_score": 0.7,
            "urgent": False,
            "story": "Suresh is in 6th grade and dreams of becoming an engineer. He needs help with tuition fees.",
            "location": "Ahmedabad",
            "items_needed": ["tuition fees", "books"]
        }
    ]

    # Filter by category if specified
    if category and category != "all":
        mock = [c for c in mock if c["category"] == category]

    print(f"[read_tools] Using mock children data ({len(mock[:max_results])} results)")
    return mock[:max_results]


def _mock_orphanages(supply_type: Optional[str], max_results: int) -> list[dict]:
    """Returns realistic mock orphanages for testing without a backend."""

    mock = [
        {
            "id": "orphanage_001",
            "name": "Sunshine Children's Home",
            "location": "Delhi",
            "urgency_score": 0.95,
            "urgent": True,
            "children_count": 45,
            "supplies_needed": [
                {"item": "blankets",    "quantity": 50,  "estimated_cost": 7500},
                {"item": "books",       "quantity": 40,  "estimated_cost": 4000}
            ],
            "contact": "sunshine@example.com",
            "verified": True
        },
        {
            "id": "orphanage_002",
            "name": "Hope Foundation",
            "location": "Mumbai",
            "urgency_score": 0.85,
            "urgent": True,
            "children_count": 30,
            "supplies_needed": [
                {"item": "uniforms",    "quantity": 30,  "estimated_cost": 9000},
                {"item": "stationery",  "quantity": 30,  "estimated_cost": 3000}
            ],
            "contact": "hope@example.com",
            "verified": True
        },
        {
            "id": "orphanage_003",
            "name": "Rainbow Care Home",
            "location": "Chennai",
            "urgency_score": 0.7,
            "urgent": False,
            "children_count": 20,
            "supplies_needed": [
                {"item": "food",        "quantity": 1,   "estimated_cost": 15000},
                {"item": "mattresses",  "quantity": 10,  "estimated_cost": 8000}
            ],
            "contact": "rainbow@example.com",
            "verified": True
        }
    ]

    # Filter by supply type if specified
    if supply_type:
        mock = [
            o for o in mock
            if any(s["item"] == supply_type for s in o["supplies_needed"])
        ]

    print(f"[read_tools] Using mock orphanage data ({len(mock[:max_results])} results)")
    return mock[:max_results]


# ============================================================
# QUICK TEST — run this file directly to test all functions
# Command: python tools/read_tools.py
# ============================================================

if __name__ == "__main__":
    import asyncio

    async def run_tests():
        print("=" * 60)
        print("Testing read_tools.py (mock data mode)")
        print("=" * 60)

        # Test 1: search children
        print("\n1. search_children(category='education')")
        children = await search_children(category="education")
        for c in children:
            print(f"   {c['name']} | urgency={c['urgency_score']} | needs ₹{c['funding_needed']}")

        # Test 2: rank by urgency
        print("\n2. rank_by_urgency()")
        all_children = await search_children()
        ranked = rank_by_urgency(all_children)
        for c in ranked:
            print(f"   {c['name']} | urgency={c['urgency_score']}")

        # Test 3: calculate allocation
        print("\n3. calculate_allocation(₹5000, top 3 children)")
        top3 = ranked[:3]
        allocations = calculate_allocation(5000.0, top3)
        for a in allocations:
            print(f"   {a['child_name']} → ₹{a['allocated_amount']} ({a['percentage']}%)")

        # Test 4: search orphanages
        print("\n4. search_orphanages(urgent_only=True)")
        orphanages = await search_orphanages(urgent_only=True)
        for o in orphanages:
            print(f"   {o['name']} | urgency={o['urgency_score']} | children={o['children_count']}")

        # Test 5: emergency filter
        print("\n5. filter_emergency_cases()")
        all_kids = await search_children()
        emergencies = filter_emergency_cases(all_kids)
        for c in emergencies:
            print(f"   {c['name']} | urgency={c['urgency_score']} ← EMERGENCY")

        print("\n" + "=" * 60)
        print("All tests complete")
        print("=" * 60)

    asyncio.run(run_tests())
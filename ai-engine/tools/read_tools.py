import httpx
import os
from dotenv import load_dotenv

load_dotenv()
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000/api")

async def search_children(category=None, max_results=3, urgent_only=False):
    """
    Search database for matching children.
    """
    print(f"[read_tools] Searching children: category={category}, urgent={urgent_only}")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BACKEND_API_URL}/children")
            if response.status_code == 200:
                children = response.json().get("data", [])
                if urgent_only:
                    children = [c for c in children if c.get("attendanceStats", {}).get("percentage", 100) < 80]
                return children[:max_results]
        except Exception as e:
            print(f"[read_tools] Error searching children: {e}")
    return []

async def search_orphanages(supply_type=None, urgent_only=False, max_results=3):
    """
    Search database for matching orphanages.
    """
    print(f"[read_tools] Searching orphanages: type={supply_type}, urgent={urgent_only}")
    # Mocking for MVP purposes
    return [
        {"id": "orp1", "name": "Shanti Hope Home", "needs": supply_type or "General supplies", "urgency": 9},
        {"id": "orp2", "name": "Bala Kalyan", "needs": supply_type or "Food & blankets", "urgency": 7}
    ][:max_results]

def rank_by_urgency(items):
    """
    Sort list by urgency_score descending.
    """
    return sorted(items, key=lambda x: x.get("urgency", 0), reverse=True)

def calculate_allocation(amount, recipients):
    """
    Splits donation amount across recipients proportionally.
    """
    if not recipients:
        return []
    share = amount / len(recipients)
    return [{"recipient": r, "amount": share} for r in recipients]

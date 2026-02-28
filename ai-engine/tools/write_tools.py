import httpx
import os
from dotenv import load_dotenv

load_dotenv()
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000/api")

async def execute_donation(plan, user_id, confirmed):
    """
    Writes donation to DB via Node.js backend API.
    """
    if not confirmed:
        raise ValueError("Donation must be confirmed before execution.")

    print(f"[write_tools] Executing donation for user {user_id}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BACKEND_API_URL}/donations",
                json={
                    "amount": plan.get("total_amount"),
                    "message": plan.get("summary"),
                    "childId": plan.get("child_id"),
                    "orphanageId": plan.get("orphanage_id")
                }
            )
            return response.json()
        except Exception as e:
            print(f"[write_tools] Error executing donation: {e}")
            return {"success": False, "message": str(e)}

async def update_funding_status(child_id, amount):
    """
    Updates how much funding a child has received.
    """
    print(f"[write_tools] Updating funding status for child {child_id}: +{amount}")
    return {"success": True}

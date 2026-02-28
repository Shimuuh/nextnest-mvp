from tools.read_tools import search_children, rank_by_urgency
from tools.write_tools import execute_donation

async def run(intent, user_id, mode="propose", proposal=None):
    """
    Emergency Medical Workflow.
    """
    print(f"[emergency_medical] Mode: {mode}, Amount: ₹{intent.amount}")

    if mode == "propose":
        results = await search_children(category="medical", urgent_only=True)
        ranked_results = rank_by_urgency(results)
        top_matches = ranked_results[:2]
        summary = "I have identified the most urgent medical cases requiring immediate assistance."
        return {
            "summary": summary,
            "children": top_matches,
            "total_amount": intent.amount,
            "has_write_action": True
        }

    elif mode == "execute":
        if not proposal: raise ValueError("Proposal missing")
        execution_result = await execute_donation(proposal, user_id, confirmed=True)
        return {
            "success": True,
            "impact_summary": "Emergency medical aid has been dispatched. Thank you for your fast action!",
            "details": execution_result
        }

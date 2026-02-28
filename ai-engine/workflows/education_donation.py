from tools.read_tools import search_children, rank_by_urgency
from tools.write_tools import execute_donation

async def run(intent, user_id, mode="propose", proposal=None):
    """
    Education Donation Workflow.
    """
    print(f"[education_donation] Mode: {mode}, Amount: ₹{intent.amount}")

    if mode == "propose":
        results = await search_children(category="education")
        ranked_results = rank_by_urgency(results)
        top_matches = ranked_results[:3]
        summary = f"I've found {len(top_matches)} children needing help with education costs. "
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
            "impact_summary": f"Your ₹{proposal['total_amount']} donation for education is complete!",
            "details": execution_result
        }

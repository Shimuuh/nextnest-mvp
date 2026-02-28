from tools.read_tools import search_children, rank_by_urgency
from tools.write_tools import execute_donation, update_funding_status

async def run(intent, user_id, mode="propose", proposal=None):
    """
    Child Sponsorship Workflow.
    """
    print(f"[child_sponsorship] Mode: {mode}, Amount: ₹{intent.amount}")

    if mode == "propose":
        results = await search_children(category="sponsorship")
        ranked_results = rank_by_urgency(results)
        top_matches = ranked_results[:3]
        summary = f"I've found {len(top_matches)} children who are looking for sponsorship. "
        summary += " ".join([f"{c['name']} (Age {c.get('age', 'N/A')})" for c in top_matches])
        
        return {
            "summary": summary,
            "children": top_matches,
            "total_amount": intent.amount,
            "type": "monthly_sponsorship",
            "has_write_action": True
        }

    elif mode == "execute":
        if not proposal:
            raise ValueError("Proposal missing for execution")
        execution_result = await execute_donation(proposal, user_id, confirmed=True)
        for child in proposal.get("children", []):
            await update_funding_status(child.get("_id"), proposal["total_amount"] / len(proposal["children"]))
        impact = f"Thank you! You have started a monthly sponsorship of ₹{proposal['total_amount']} for these children."
        return {
            "success": True,
            "impact_summary": impact,
            "details": execution_result
        }

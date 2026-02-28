from tools.read_tools import search_orphanages, rank_by_urgency
from tools.write_tools import execute_donation
from agent.response_builder import build_impact_summary

async def run(intent, user_id, mode="propose", proposal=None):
    """
    Orphanage Supply Workflow.
    """
    print(f"[orphanage_supply] Mode: {mode}, Amount: ₹{intent.amount}")

    if mode == "propose":
        supply_type = intent.filters.get("item", "General supplies")
        urgent_only = intent.filters.get("urgent", False)
        results = await search_orphanages(supply_type, urgent_only)
        ranked_results = rank_by_urgency(results)
        
        top_matches = ranked_results[:3]
        summary = f"I've found {len(top_matches)} orphanages that urgently need {supply_type}. "
        summary += " ".join([f"{o['name']} (Urgency: {o['urgency']}/10)" for o in top_matches])
        
        return {
            "summary": summary,
            "matches": top_matches,
            "total_amount": intent.amount,
            "item": supply_type,
            "has_write_action": True
        }

    elif mode == "execute":
        if not proposal:
            raise ValueError("Proposal missing for execution")
        execution_result = await execute_donation(proposal, user_id, confirmed=True)
        impact = f"Success! Your donation of ₹{proposal['total_amount']} has been processed for {proposal['item']} supplies."
        return {
            "success": True,
            "impact_summary": impact,
            "details": execution_result
        }

import json
from .llm_client import get_llm_json_response

def match_opportunities(child_data: dict, available_opportunities: list) -> dict:
    """
    Agent 4: Transition Success Predictor & Opportunity Matcher.
    Predicts long-term success and matches with jobs/vocational training.
    """
    
    system_prompt = """
    You are an expert career counselor AI and transition planner for at-risk youth.
    Analyze the youth's skills, age, and education against the available opportunities.
    
    You MUST return your analysis in ONLY valid JSON format, matching this exact schema:
    {
      "readinessScore": number (0-100 indicating readiness to age out of care independently),
      "topMatches": [
         {
            "opportunityId": "ID",
            "title": "Title of Opportunity",
            "probabilityOfSuccess": number (0-100),
            "reasoning": "Why this is a good fit",
            "skillGaps": array of strings (skills they need to learn to succeed here)
         }
      ]
    }
    """
    
    user_prompt = f"""
    Youth Profile:
    {json.dumps(child_data, indent=2)}
    
    Active Opportunities Database:
    {json.dumps(available_opportunities, indent=2)}
    """
    
    llm_response_text = get_llm_json_response(system_prompt, user_prompt)
    
    try:
        return json.loads(llm_response_text)
    except json.JSONDecodeError:
        return {
            "readinessScore": 0,
            "topMatches": []
        }

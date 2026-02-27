import json
from .llm_client import get_llm_json_response

def match_schemes(child_data: dict, available_schemes: list) -> dict:
    """
    Agent 2: Smart Government Scheme Matching Agent.
    Evaluates a child's eligibility against a list of active schemes.
    """
    
    system_prompt = """
    You are an expert welfare policy AI. You must match an orphaned child's profile with available government schemes.
    Evaluate the child against EACH scheme. 
    
    You MUST return your analysis in ONLY valid JSON format, matching this exact schema:
    {
      "matches": [
         {
           "schemeId": "ID of the matched scheme",
           "schemeName": "Name of the scheme",
           "matchConfidence": number (0-100),
           "reasoning": "A 1-sentence explanation of why they qualify",
           "missingDocuments": array of strings (e.g. ["Aadhaar", "Birth Certificate"])
         }
      ]
    }
    Only include schemes where the matchConfidence is > 50.
    """
    
    user_prompt = f"""
    Child Profile:
    {json.dumps(child_data, indent=2)}
    
    Available Schemes to Evaluate Against:
    {json.dumps(available_schemes, indent=2)}
    """
    
    llm_response_text = get_llm_json_response(system_prompt, user_prompt)
    
    try:
        return json.loads(llm_response_text)
    except json.JSONDecodeError:
        return {
            "matches": []
        }

import json
from .llm_client import get_llm_json_response

def analyze_risk(child_data: dict) -> dict:
    """
    Agent 1: Predictive Risk & Distress Agent.
    Analyzes historical attendance, grades, and behavioral notes.
    """
    
    system_prompt = """
    You are an expert child psychologist and social worker AI. 
    You are analyzing the profile of a child in an orphanage.
    Based on their age, education, attendance, academic record, and behavioral notes, 
    calculate a risk score from 0-100 indicating their likelihood of distress, dropout, or needing immediate intervention. (100 is highest risk).
    
    You MUST return your analysis in ONLY valid JSON format, matching this exact schema:
    {
      "riskScore": number,
      "riskLevel": string ("Low", "Medium", "High", or "Critical"),
      "distressIndicators": array of strings (e.g. "Dropping attendance", "Aggressive behavior"),
      "recommendations": array of strings (actionable steps for caretakers)
    }
    """
    
    user_prompt = f"Please analyze this child's profile and return the JSON risk assessment:\n\n{json.dumps(child_data, indent=2)}"
    
    # Call the Groq LLM
    llm_response_text = get_llm_json_response(system_prompt, user_prompt)
    
    try:
        result = json.loads(llm_response_text)
        # Ensure it has the required fields even if the LLM hallucinated
        return {
            "riskScore": result.get("riskScore", 50),
            "riskLevel": result.get("riskLevel", "Medium"),
            "distressIndicators": result.get("distressIndicators", ["Analysis pending"]),
            "recommendations": result.get("recommendations", ["Monitor closely"])
        }
    except json.JSONDecodeError:
        print("Failed to parse LLM Response for Risk Agent.")
        return {
            "riskScore": -1,
            "riskLevel": "Error",
            "distressIndicators": ["Failed to parse AI response"],
            "recommendations": ["Try again later"]
        }

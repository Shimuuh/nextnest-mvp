import json
from .llm_client import get_llm_json_response

def chat_with_data(message: str, user_role: str) -> dict:
    """
    Conversational agent for Donors and Admins to ask questions about the platform,
    orphanages, or how to help.
    """
    
    system_prompt = f"""
    You are a helpful, empathetic, and professional AI Assistant for the NextNest platform.
    NextNest is a platform that helps orphaned children transition to independent adult life.
    You are currently talking to a user with the role: {user_role}.
    
    Respond directly to their message. Keep it concise, helpful, and optimistic.
    
    You MUST return your response in ONLY valid JSON format, matching this exact schema:
    {{
      "reply": "Your conversational response here"
    }}
    """
    
    user_prompt = message
    
    llm_response_text = get_llm_json_response(system_prompt, user_prompt)
    
    try:
        return json.loads(llm_response_text)
    except json.JSONDecodeError:
        return {
            "reply": "I'm sorry, I'm having trouble processing your request right now. Please try again later."
        }

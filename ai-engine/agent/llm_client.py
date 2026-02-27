import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# We will use the Groq client as the user provided a GSK key
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

MODEL_NAME = os.environ.get("LLM_MODEL", "llama3-70b-8192")

def get_llm_json_response(system_prompt: str, user_prompt: str) -> str:
    """
    Calls the Groq API and expects a JSON response.
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            model=MODEL_NAME,
            temperature=0.2, # Keep low for JSON generation
            response_format={"type": "json_object"} 
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return "{}"


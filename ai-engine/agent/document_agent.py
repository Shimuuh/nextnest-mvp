import json
from .llm_client import get_llm_json_response

def process_document(image_url: str, doc_type: str) -> dict:
    """
    Agent 3: Smart Document Extraction Agent.
    Simulates OCR + AI extraction of structured data from an identity document.
    *(Since Groq doesn't natively support vision in this setup, we simulate 
      by passing the URL to the LLM and asking it to 'extract' mock data based on the doc_type)*
    """
    
    system_prompt = f"""
    You are an expert OCR and Document AI. 
    You are given an image URL of a {doc_type} document for a child in an orphanage.
    
    Extract the key information into structured JSON. If you cannot see the image, 
    generate highly realistic mock data appropriate for an Indian {doc_type}.
    
    You MUST return your analysis in ONLY valid JSON format, matching this exact schema:
    {{
      "extractedData": {{
          "fullName": "Name",
          "dateOfBirth": "YYYY-MM-DD",
          "idNumber": "1234 5678 9012"
      }},
      "confidenceScore": number (0-100),
      "anomaliesDetected": array of strings (e.g. "Blurry photo", "Name mismatch")
    }}
    """
    
    user_prompt = f"Analyze this document: {image_url}"
    
    llm_response_text = get_llm_json_response(system_prompt, user_prompt)
    
    try:
        return json.loads(llm_response_text)
    except json.JSONDecodeError:
        return {
            "extractedData": {},
            "confidenceScore": 0,
            "anomaliesDetected": ["Failed to process image"]
        }

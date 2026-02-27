# ============================================================
# intent_classifier.py — Understands what the user wants
# Called by operator.py after receiving a user message.
# Takes raw human text → returns a clean Intent object.
#
# Has two modes:
#   1. LLM mode  — uses Claude/GPT-4 for smart understanding
#   2. Fallback  — uses keywords if no LLM is configured yet
#
# You can test the entire system today without an API key
# because the fallback handles everything automatically.
# ============================================================

import os
import json
import re
from typing import Optional
from pydantic import BaseModel

# ============================================================
# Intent Model
# This is what this file produces — a clean structured object
# that operator.py can understand and act on.
# ============================================================

class Intent(BaseModel):
    workflow: str
    # Which workflow to run. One of:
    # "education_donation"  → donate to children needing education
    # "emergency_medical"   → urgent medical fundraising
    # "orphanage_supply"    → send supplies to orphanages
    # "child_sponsorship"   → sponsor an individual child long-term

    amount: Optional[float] = None
    # Donation amount in ₹ if mentioned by user
    # Example: "Donate ₹5000" → amount = 5000.0
    # If not mentioned → None (workflow will ask user later)

    filters: dict = {}
    # Extra details extracted from the message
    # Example: {"category": "books", "urgent": True}
    # Used by workflows to narrow down search results

    raw_message: str = ""
    # The original user message, saved for context and memory

    confidence: float = 1.0
    # How confident we are about the classification
    # 0.0 = guessing, 1.0 = certain
    # Below 0.6 → needs_clarification is set to True

    needs_clarification: bool = False
    # True if the message is too vague to act on
    # Example: "I want to help" → unclear what kind of help

    clarification_question: Optional[str] = None
    # The question to ask the user if needs_clarification is True
    # Example: "Would you like to donate money, sponsor a child,
    #           or send supplies to an orphanage?"

# ============================================================
# MAIN FUNCTION — called by operator.py
# This is the only function operator.py needs to call.
# ============================================================

async def classify(message: str, session_id: str = "") -> Intent:
    """
    Takes a raw user message and returns a structured Intent.

    Usage in operator.py:
        from agent.intent_classifier import classify
        intent = await classify(request.message, request.session_id)

    Args:
        message    : raw text from user e.g. "Donate ₹5000 for books"
        session_id : used for logging and future memory support

    Returns:
        Intent object with workflow, amount, filters, confidence
    """

    # Check if an LLM API key is configured
    # If yes → use LLM for smart classification
    # If no  → use keyword fallback (works without any API key)

    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")

    if api_key:
        # ── LLM MODE ──────────────────────────────────────────
        try:
            intent = await _classify_with_llm(message, api_key)
            intent.raw_message = message
            return intent
        except Exception as e:
            # If LLM call fails for any reason, fall back to keywords
            print(f"[intent_classifier] LLM failed ({e}), using fallback")
            return _fallback_intent(message)
    else:
        # ── FALLBACK MODE ─────────────────────────────────────
        # No API key configured — use keyword matching
        # This lets you build and test all workflows right now
        print("[intent_classifier] No API key found, using keyword fallback")
        return _fallback_intent(message)


# ============================================================
# LLM CLASSIFICATION — smart understanding using Claude/GPT-4
# Only called when an API key is available
# ============================================================

async def _classify_with_llm(message: str, api_key: str) -> Intent:
    """
    Sends the message to the LLM and parses the structured response.
    Supports both Anthropic (Claude) and OpenAI (GPT-4).
    """

    prompt = _build_prompt(message)

    # ── Detect which LLM to use based on which key is set ──
    if os.getenv("ANTHROPIC_API_KEY"):
        raw_response = await _call_anthropic(prompt)
    else:
        raw_response = await _call_openai(prompt)

    return _parse_llm_response(raw_response, message)


def _build_prompt(message: str) -> str:
    """
    Builds the prompt sent to the LLM.
    Tells the LLM exactly what to extract and how to format it.
    Returns a string prompt.
    """

    return f"""You are an intent classifier for a donation platform that helps
orphanages and children in need. Your job is to read a user's message
and extract their intent as structured JSON.

The platform supports exactly these 4 workflows:
1. education_donation  — donating money or items for children's education
2. emergency_medical   — urgent medical fundraising for sick children
3. orphanage_supply    — sending physical supplies to orphanages
4. child_sponsorship   — sponsoring an individual child long-term

User message: "{message}"

Extract the following and return ONLY valid JSON, no explanation:
{{
  "workflow": "<one of the 4 workflow IDs above>",
  "amount": <number in rupees or null if not mentioned>,
  "filters": {{
    "category": "<education|medical|food|clothing|books|blankets|other or null>",
    "urgent": <true if words like urgent/emergency/critical/immediately used>,
    "item": "<specific item mentioned like books/blankets/uniforms or null>"
  }},
  "confidence": <0.0 to 1.0, how certain you are>,
  "needs_clarification": <true if message is too vague to act on>,
  "clarification_question": "<question to ask user if unclear, else null>"
}}

Rules:
- If the message mentions sickness, hospital, surgery, treatment → emergency_medical
- If the message mentions books, school, uniform, fees, education → education_donation
- If the message mentions blankets, food, supplies, items, materials → orphanage_supply
- If the message mentions sponsor, monthly, long-term, support a child → child_sponsorship
- If truly unclear, set needs_clarification to true and suggest a clarification question
- Always return valid JSON only"""


async def _call_anthropic(prompt: str) -> str:
    """
    Calls the Anthropic Claude API.
    Requires ANTHROPIC_API_KEY in .env
    Switch model name here when needed.
    """
    import anthropic

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    response = client.messages.create(
        model="claude-3-5-haiku-20241022",   # fast and cheap, good for classification
        max_tokens=300,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.content[0].text


async def _call_openai(prompt: str) -> str:
    """
    Calls the OpenAI GPT-4 API.
    Requires OPENAI_API_KEY in .env
    """
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4o-mini",    # fast and cheap, good for classification
        max_tokens=300,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


def _parse_llm_response(raw_response: str, original_message: str) -> Intent:
    """
    Parses the raw LLM text response into a clean Intent object.
    If parsing fails for any reason, returns a safe fallback
    instead of crashing the whole system.

    Args:
        raw_response     : raw text from LLM (should be JSON)
        original_message : kept for raw_message field
    """

    try:
        # Strip markdown code fences if LLM wrapped response in ```json ... ```
        cleaned = re.sub(r"```json|```", "", raw_response).strip()

        data = json.loads(cleaned)

        return Intent(
            workflow=data.get("workflow", "education_donation"),
            amount=data.get("amount"),
            filters=data.get("filters", {}),
            confidence=float(data.get("confidence", 0.8)),
            needs_clarification=bool(data.get("needs_clarification", False)),
            clarification_question=data.get("clarification_question"),
            raw_message=original_message
        )

    except Exception as e:
        # LLM returned something we couldn't parse
        # Fall back to keyword matching rather than crashing
        print(f"[intent_classifier] Failed to parse LLM response: {e}")
        print(f"[intent_classifier] Raw response was: {raw_response}")
        return _fallback_intent(original_message)


# ============================================================
# FALLBACK CLASSIFIER — keyword based, no LLM needed
# Used when: no API key set, LLM call fails, or LLM times out
# Keeps the system working at all times during development
# ============================================================

def _fallback_intent(message: str) -> Intent:
    """
    Simple keyword-based intent classification.
    No LLM required — works offline and without any API key.
    Good enough for testing all 4 workflows during development.

    Priority order (most specific first):
    1. emergency_medical  — highest priority
    2. child_sponsorship
    3. orphanage_supply
    4. education_donation — default fallback
    """

    msg = message.lower()

    # ── Extract amount if mentioned ──────────────────────────
    amount = None
    # Matches: ₹5000, Rs 5000, 5000 rupees, INR 5000
    amount_patterns = [
        r'₹\s*(\d+(?:,\d+)*(?:\.\d+)?)',
        r'rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)',
        r'(\d+(?:,\d+)*(?:\.\d+)?)\s*rupees',
        r'inr\s*(\d+(?:,\d+)*(?:\.\d+)?)',
    ]
    for pattern in amount_patterns:
        match = re.search(pattern, msg)
        if match:
            amount = float(match.group(1).replace(",", ""))
            break

    # ── Detect urgency ────────────────────────────────────────
    urgent_keywords = ["urgent", "emergency", "critical", "immediately",
                       "asap", "right now", "serious", "severe"]
    is_urgent = any(word in msg for word in urgent_keywords)

    # ── Classify workflow by keywords ─────────────────────────

    # Emergency Medical — check first (highest priority)
    medical_keywords = ["sick", "hospital", "surgery", "treatment", "medicine",
                        "medical", "disease", "operation", "doctor", "ill",
                        "emergency", "cancer", "injury", "health"]
    if any(word in msg for word in medical_keywords):
        return Intent(
            workflow="emergency_medical",
            amount=amount,
            filters={"urgent": True, "category": "medical"},
            confidence=0.85,
            needs_clarification=False,
            raw_message=message
        )

    # Child Sponsorship
    sponsorship_keywords = ["sponsor", "sponsorship", "monthly", "long-term",
                            "long term", "adopt", "support a child", "regular"]
    if any(word in msg for word in sponsorship_keywords):
        return Intent(
            workflow="child_sponsorship",
            amount=amount,
            filters={"urgent": is_urgent, "category": "sponsorship"},
            confidence=0.85,
            needs_clarification=False,
            raw_message=message
        )

    # Orphanage Supply
    supply_keywords = ["supply", "supplies", "blanket", "blankets", "food",
                       "clothes", "clothing", "uniform", "uniforms", "items",
                       "material", "stationery", "toys", "mattress", "bed",
                       "orphanage", "send", "donate items", "donate goods"]
    if any(word in msg for word in supply_keywords):
        # Try to detect specific item mentioned
        item = None
        item_map = {
            "blanket": "blankets", "book": "books", "uniform": "uniforms",
            "food": "food", "toy": "toys", "stationery": "stationery",
            "clothes": "clothing", "mattress": "mattress"
        }
        for key, val in item_map.items():
            if key in msg:
                item = val
                break

        return Intent(
            workflow="orphanage_supply",
            amount=amount,
            filters={"urgent": is_urgent, "category": "supplies", "item": item},
            confidence=0.85,
            needs_clarification=False,
            raw_message=message
        )

    # Education Donation — default
    education_keywords = ["education", "school", "book", "books", "study",
                          "learn", "uniform", "fee", "fees", "tuition",
                          "scholarship", "college", "class", "stationary"]

    if any(word in msg for word in education_keywords):
        return Intent(
            workflow="education_donation",
            amount=amount,
            filters={"urgent": is_urgent, "category": "education"},
            confidence=0.85,
            needs_clarification=False,
            raw_message=message
        )

    # ── Too vague — ask for clarification ────────────────────
    # If no keywords matched and message is very short/unclear
    if len(msg.split()) < 4:
        return Intent(
            workflow="education_donation",  # safe default
            amount=amount,
            filters={},
            confidence=0.3,
            needs_clarification=True,
            clarification_question=(
                "I'd love to help! Could you tell me more about what you'd like to do? "
                "For example: donate money for education, help with a medical emergency, "
                "send supplies to an orphanage, or sponsor a child monthly?"
            ),
            raw_message=message
        )

    # ── Generic donation — default to education ───────────────
    return Intent(
        workflow="education_donation",
        amount=amount,
        filters={"urgent": is_urgent},
        confidence=0.6,
        needs_clarification=False,
        raw_message=message
    )


# ============================================================
# QUICK TEST — run this file directly to test classification
# Command: python intent_classifier.py
# ============================================================

if __name__ == "__main__":
    import asyncio

    test_messages = [
        "Donate ₹5000 to children who need books and uniforms",
        "Help a child who needs urgent surgery, I have ₹10000",
        "Send blankets to an orphanage that needs them urgently",
        "I want to sponsor a child monthly for education and meals",
        "Help",                          # vague → should ask clarification
        "I want to donate ₹2000",        # no category → defaults to education
    ]

    async def run_tests():
        print("=" * 60)
        print("Testing intent_classifier.py (fallback mode)")
        print("=" * 60)
        for msg in test_messages:
            intent = await classify(msg)
            print(f"\nMessage  : {msg}")
            print(f"Workflow : {intent.workflow}")
            print(f"Amount   : ₹{intent.amount}" if intent.amount else "Amount   : not mentioned")
            print(f"Filters  : {intent.filters}")
            print(f"Confidence: {intent.confidence}")
            if intent.needs_clarification:
                print(f"Clarify  : {intent.clarification_question}")
        print("\n" + "=" * 60)

    asyncio.run(run_tests())
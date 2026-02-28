# ============================================================
# config/settings.py — Central Configuration File
# Every file in the AI engine imports from here.
# Never hardcode API keys, limits, or model names anywhere else.
# All sensitive values come from the .env file.
# ============================================================

import os
from dotenv import load_dotenv

# Load all values from .env file into environment
load_dotenv()

# ============================================================
# LLM CONFIGURATION
# Controls which AI model the intent classifier and
# workflows use. Switch models here without touching
# any other file.
# ============================================================

# Which LLM provider to use: "groq" | "anthropic" | "openai" | "fallback"
# "groq"     = FREE — recommended for this project
# "fallback" = no LLM, uses keyword matching only (good for testing)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")

# ── GROQ (FREE — Recommended) ────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
# llama-3.3-70b-versatile  → best reasoning  (recommended for workflows)
# llama-3.1-8b-instant     → fastest         (good for intent classification)

# ── Anthropic (Claude) settings ──────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL   = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
# claude-3-5-haiku-20241022  → fast + cheap  (recommended for classification)
# claude-opus-4-6            → most powerful  (use for complex reasoning)

# ── OpenAI (GPT-4) settings ──────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
# gpt-4o-mini  → fast + cheap  (recommended for classification)
# gpt-4o       → most powerful (use for complex reasoning)

# Maximum tokens the LLM can return per response
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "500"))

# ============================================================
# SAFETY LIMITS
# Hard limits that protect against accidental large donations
# or runaway agent behavior. Change these carefully.
# ============================================================

# Maximum single donation amount (₹) the agent can process
# without escalating to manual review
MAX_DONATION_AMOUNT = float(os.getenv("MAX_DONATION_AMOUNT", "50000"))

# Maximum number of children one donation can be split across
MAX_ALLOCATION_COUNT = int(os.getenv("MAX_ALLOCATION_COUNT", "10"))

# If donation amount exceeds this, always require confirmation
# even if the user said "just do it"
ALWAYS_CONFIRM_ABOVE = float(os.getenv("ALWAYS_CONFIRM_ABOVE", "1000"))

# ============================================================
# DATABASE / BACKEND API
# The AI engine talks to your Node.js backend via HTTP.
# It never connects to the database directly.
# ============================================================

# Base URL of your Node.js backend API
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000/api")

# Secret key shared between AI engine and Node.js backend
# Node.js checks this header to verify requests came from the AI engine
BACKEND_API_SECRET = os.getenv("BACKEND_API_SECRET", "dev-secret-change-in-production")

# How long to wait for a backend API response (seconds)
BACKEND_TIMEOUT = int(os.getenv("BACKEND_TIMEOUT", "10"))

# ============================================================
# AI ENGINE SERVER
# FastAPI server settings
# ============================================================

# Host and port for the AI engine
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Enable auto-reload on file changes (development only)
# Set to "false" in production
RELOAD = os.getenv("RELOAD", "true").lower() == "true"

# ============================================================
# MEMORY SETTINGS
# Controls how much context the agent remembers per user
# ============================================================

# How many past messages to keep in session memory
MAX_MEMORY_MESSAGES = int(os.getenv("MAX_MEMORY_MESSAGES", "10"))

# How long (seconds) before a session expires
SESSION_TTL = int(os.getenv("SESSION_TTL", "3600"))  # 1 hour default

# ============================================================
# WORKFLOW SETTINGS
# Fine-tune individual workflow behavior
# ============================================================

# Education donation — max children to show in allocation plan
EDUCATION_MAX_RESULTS = int(os.getenv("EDUCATION_MAX_RESULTS", "5"))

# Emergency medical — urgency score threshold (0.0 to 1.0)
# Only children above this threshold shown as emergency cases
EMERGENCY_URGENCY_THRESHOLD = float(os.getenv("EMERGENCY_URGENCY_THRESHOLD", "0.7"))

# Orphanage supply — max orphanages to show per request
SUPPLY_MAX_ORPHANAGES = int(os.getenv("SUPPLY_MAX_ORPHANAGES", "3"))

# Child sponsorship — minimum monthly amount (₹)
SPONSORSHIP_MIN_AMOUNT = float(os.getenv("SPONSORSHIP_MIN_AMOUNT", "500"))

# ============================================================
# HELPER: Get the active LLM instance
# Import and call get_llm() anywhere you need the LLM.
# Automatically picks the right provider from LLM_PROVIDER.
# ============================================================

def get_llm(fast: bool = False):
    """
    Returns a ready-to-use LLM instance based on LLM_PROVIDER.

    Args:
        fast (bool): If True and using Groq, returns the faster
                     8B model instead of 70B. Good for intent
                     classification where speed matters more.

    Returns:
        LLM instance or None if fallback mode
    """

    if LLM_PROVIDER == "groq":
        from langchain_groq import ChatGroq
        model = "llama-3.1-8b-instant" if fast else GROQ_MODEL
        return ChatGroq(
            api_key=GROQ_API_KEY,
            model_name=model,
            temperature=0.1,
            max_tokens=LLM_MAX_TOKENS
        )

    elif LLM_PROVIDER == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            api_key=ANTHROPIC_API_KEY,
            model=ANTHROPIC_MODEL,
            max_tokens=LLM_MAX_TOKENS
        )

    elif LLM_PROVIDER == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            api_key=OPENAI_API_KEY,
            model=OPENAI_MODEL,
            max_tokens=LLM_MAX_TOKENS
        )

    else:
        # fallback — no LLM, keyword matching only
        return None


# ============================================================
# HELPER FUNCTION
# Call this at startup to verify everything is configured
# ============================================================

def validate_settings() -> dict:
    """
    Checks the current configuration and returns a status report.
    Called by main.py at startup so you know what's configured.

    Returns:
        dict with status of each setting group
    """

    issues = []
    warnings = []

    # Check LLM configuration
    if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
        issues.append("LLM_PROVIDER is 'groq' but GROQ_API_KEY is missing in .env")

    if LLM_PROVIDER == "anthropic" and not ANTHROPIC_API_KEY:
        issues.append("LLM_PROVIDER is 'anthropic' but ANTHROPIC_API_KEY is missing")

    if LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
        issues.append("LLM_PROVIDER is 'openai' but OPENAI_API_KEY is missing")

    if LLM_PROVIDER == "fallback":
        warnings.append("Using keyword fallback — no LLM configured yet")

    # Check backend connection
    if BACKEND_API_SECRET == "dev-secret-change-in-production":
        warnings.append("Using default BACKEND_API_SECRET — change before production")

    # Check safety limits
    if MAX_DONATION_AMOUNT > 100000:
        warnings.append(f"MAX_DONATION_AMOUNT is ₹{MAX_DONATION_AMOUNT} — very high, verify this is intentional")

    # Determine active model name for display
    active_model = {
        "groq": GROQ_MODEL,
        "anthropic": ANTHROPIC_MODEL,
        "openai": OPENAI_MODEL,
    }.get(LLM_PROVIDER, "none (fallback mode)")

    return {
        "llm_provider": LLM_PROVIDER,
        "llm_model": active_model,
        "backend_url": BACKEND_API_URL,
        "max_donation": f"₹{MAX_DONATION_AMOUNT}",
        "issues": issues,       # critical problems that will break things
        "warnings": warnings,   # non-critical but worth knowing
        "ready": len(issues) == 0
    }


# ============================================================
# QUICK TEST — run this file to check your configuration
# Command: python config/settings.py
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("HopeLink AI Engine — Configuration Check")
    print("=" * 60)

    status = validate_settings()

    print(f"\nLLM Provider  : {status['llm_provider']}")
    print(f"LLM Model     : {status['llm_model']}")
    print(f"Backend URL   : {status['backend_url']}")
    print(f"Max Donation  : {status['max_donation']}")

    if status["warnings"]:
        print("\n⚠️  Warnings:")
        for w in status["warnings"]:
            print(f"   - {w}")

    if status["issues"]:
        print("\n❌ Issues (must fix):")
        for i in status["issues"]:
            print(f"   - {i}")
    else:
        print("\n✅ No critical issues found")

    print(f"\nSystem ready  : {'✅ YES' if status['ready'] else '❌ NO'}")
    print("=" * 60)
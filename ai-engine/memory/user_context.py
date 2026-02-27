# ============================================================
# memory/user_context.py — Session Memory
# Stores temporary session data between Pass 1 and Pass 2.
# Most importantly: saves the pending proposal so operator.py
# can retrieve and execute it when the user confirms.
#
# Currently uses in-memory storage (dict).
# For production: replace with Redis or a database.
# ============================================================

import time
from typing import Optional
from config.settings import SESSION_TTL

# In-memory session store
# Format: { session_id: { data..., _expires_at: timestamp } }
_sessions: dict = {}


async def get_session(session_id: str) -> Optional[dict]:
    """
    Retrieves session data for a given session ID.
    Returns None if session doesn't exist or has expired.

    Args:
        session_id : unique session identifier from frontend

    Returns:
        dict of session data or None
    """

    session = _sessions.get(session_id)

    if not session:
        return None

    # Check if session has expired
    if time.time() > session.get("_expires_at", 0):
        del _sessions[session_id]
        print(f"[memory] Session {session_id} expired and removed")
        return None

    return session


async def update_session(session_id: str, data: dict) -> None:
    """
    Updates or creates session data for a given session ID.
    Merges new data with existing data.
    Resets the expiry timer on every update.

    Args:
        session_id : unique session identifier
        data       : dict of values to store/update
    """

    existing = _sessions.get(session_id, {})

    # Merge new data into existing session
    updated = {**existing, **data}

    # Reset expiry timer
    updated["_expires_at"] = time.time() + SESSION_TTL

    _sessions[session_id] = updated

    print(f"[memory] Session {session_id} updated with keys: {list(data.keys())}")


async def clear_session(session_id: str) -> None:
    """
    Completely removes a session.
    Called by POST /reset endpoint in main.py.

    Args:
        session_id : session to remove
    """

    if session_id in _sessions:
        del _sessions[session_id]
        print(f"[memory] Session {session_id} cleared")


async def get_user_preferences(user_id: str) -> dict:
    """
    Returns saved preferences for a user across sessions.
    For example: preferred donation category, past amounts.

    Currently returns empty dict — extend this later
    to persist preferences in a real database.

    Args:
        user_id : platform user ID

    Returns:
        dict of user preferences
    """

    # TODO: In production, fetch from database
    # Example: SELECT preferences FROM users WHERE id = user_id

    return {}
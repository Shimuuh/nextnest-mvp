# ============================================================
# main.py — AI Engine Entry Point
# This is the FastAPI server. The ONLY file Node.js talks to.
# It receives requests, passes them to the operator,
# and returns the result. No logic lives here.
# ============================================================

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

# We will build this file in Step 3
# For now it is imported but operator.py does not exist yet
# Uncomment this once operator.py is ready:
# from agent.operator import handle_request

# ------------------------------------------------------------
# App Setup
# ------------------------------------------------------------
app = FastAPI(
    title="HopeLink AI Engine",
    description="AI agent that connects donors with orphanages and children in need",
    version="1.0.0"
)

# ------------------------------------------------------------
# CORS Middleware
# Allows your Node.js backend (running on a different port)
# to call this FastAPI server without being blocked
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # In production, replace * with your Node.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Request Model
# This defines the exact shape of every incoming request.
# Node.js must always send these fields.
# ------------------------------------------------------------
class UserRequest(BaseModel):
    user_id: str                        # who is the user
    session_id: str                     # which conversation session
    message: str                        # what the user typed
    confirmation: bool = False          # has the user confirmed the action?
                                        # Default = False (agent proposes first)
                                        # Node.js resends with True when user clicks Confirm

# ------------------------------------------------------------
# Response Model
# This defines what we always send back to Node.js
# ------------------------------------------------------------
class AgentResponse(BaseModel):
    status: str                         # "proposal" | "executed" | "error" | "clarification"
    message: str                        # human-readable response to show the user
    workflow: Optional[str] = None      # which workflow ran e.g. "education_donation"
    proposal: Optional[dict] = None     # the plan shown to user BEFORE confirmation
    result: Optional[dict] = None       # the result AFTER confirmation and execution
    requires_confirmation: bool = False # True = frontend should show a Confirm button

# ------------------------------------------------------------
# ENDPOINT 1: POST /agent
# This is the main endpoint. Node.js calls this every time
# the user sends a message OR confirms an action.
# ------------------------------------------------------------
@app.post("/agent", response_model=AgentResponse)
async def agent_endpoint(request: UserRequest):
    """
    Main agent endpoint.

    Flow:
    1. User sends message → confirmation=False
       Agent understands intent, proposes plan, returns requires_confirmation=True
    
    2. User clicks Confirm → Node.js resends same message with confirmation=True
       Agent executes the action, returns result
    """

    # ------- TEMPORARY: until operator.py is ready -------
    # This simulates what the operator will return
    # Replace this block once operator.py is built

    return AgentResponse(
        status="proposal",
        message=f"Received your message: '{request.message}'. Operator not connected yet.",
        workflow=None,
        proposal=None,
        result=None,
        requires_confirmation=False
    )

    # ------- REAL CODE (uncomment after operator.py is ready) -------
    # result = await handle_request(request)
    # return result

# ------------------------------------------------------------
# ENDPOINT 2: GET /health
# Node.js pings this to check if the AI engine is alive
# before sending real user requests
# ------------------------------------------------------------
@app.get("/health")
def health_check():
    """
    Simple health check.
    Returns 200 OK if the server is running.
    Node.js should call this on startup and before important requests.
    """
    return {
        "status": "ok",
        "service": "HopeLink AI Engine",
        "version": "1.0.0"
    }

# ------------------------------------------------------------
# ENDPOINT 3: GET /workflows
# Returns list of workflows the agent can run.
# Frontend can use this to show available options to the user.
# ------------------------------------------------------------
@app.get("/workflows")
def list_workflows():
    """
    Returns all available workflows with descriptions.
    Useful for frontend to display what the agent can do.
    """
    return {
        "workflows": [
            {
                "id": "education_donation",
                "label": "Education Donation",
                "description": "Donate to children who need education support",
                "example": "Donate ₹5000 to children needing books and uniforms"
            },
            {
                "id": "emergency_medical",
                "label": "Emergency Medical",
                "description": "Fund urgent medical treatment for children",
                "example": "Help a child who needs surgery, I want to donate ₹10000"
            },
            {
                "id": "orphanage_supply",
                "label": "Orphanage Supply",
                "description": "Send supplies like blankets, food, or stationery to orphanages",
                "example": "Send blankets to an orphanage that needs them urgently"
            },
            {
                "id": "child_sponsorship",
                "label": "Child Sponsorship",
                "description": "Sponsor a child's monthly needs long-term",
                "example": "I want to sponsor a child for education and meals monthly"
            }
        ]
    }

# ------------------------------------------------------------
# ENDPOINT 4: POST /reset
# Clears the session memory for a user.
# Call this when user logs out or starts a fresh conversation.
# ------------------------------------------------------------
@app.post("/reset")
async def reset_session(session_id: str):
    """
    Clears session memory so previous conversation context
    does not affect new requests.
    """

    # Will connect to memory/user_context.py later
    # For now returns success

    return {
        "status": "cleared",
        "session_id": session_id,
        "message": "Session memory cleared successfully"
    }

# ------------------------------------------------------------
# GLOBAL EXCEPTION HANDLER
# If anything crashes inside the agent — bad LLM response,
# database timeout, tool failure — this catches it and returns
# a clean error to Node.js instead of a raw Python traceback.
# Critical: Node.js should never receive a 500 with no body.
# ------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled exceptions anywhere in the app.
    Returns a structured JSON error so Node.js always gets
    a readable response even when something goes wrong.
    """
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An internal error occurred in the AI engine.",
            "detail": str(exc)      # remove this line in production for security
        }
    )

# ------------------------------------------------------------
# Run the server
# python main.py   → starts on http://localhost:8000
# Node.js calls:   http://localhost:8000/agent
# ------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True     # auto-restarts when you save changes (dev only)
    )
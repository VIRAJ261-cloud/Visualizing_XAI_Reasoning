import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.services.llm_service import call_grok_llm_api

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory backup store for backend chat endpoints
_chat_db = {}

class ChatMessage(BaseModel):
    id: Optional[str] = None
    user_id: str
    sender: str
    text: str
    topic: Optional[str] = "Trust analysis"
    created_at: Optional[str] = None

class SendMessageRequest(BaseModel):
    user_id: str
    text: str
    topic: Optional[str] = "Trust analysis"
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = "Verified XAI Analyst"
    workspace_plan: Optional[str] = "Enterprise XAI Pro"

def generate_ai_response(
    text: str,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = "Verified XAI Analyst",
    workspace_plan: Optional[str] = "Enterprise XAI Pro",
    chat_history: Optional[List[dict]] = None
) -> str:
    """
    Generates real, dynamic LLM responses via Grok API for any general query.
    """
    clean = text.strip() if text else ""
    if not clean:
        display_name = user_name.strip() if user_name and user_name.strip() else "Analyst"
        return f"Hello {display_name}! I'm Clario. Feel free to ask me anything!"

    # Call Grok / Groq LLM API for dynamic un-hardcoded response
    return call_grok_llm_api(
        user_prompt=clean,
        user_name=user_name,
        user_email=user_email,
        user_role=user_role,
        workspace_plan=workspace_plan,
        chat_history=chat_history
    )

@router.get("/history/{user_id}", response_model=List[ChatMessage])
def get_chat_history(user_id: str):
    return _chat_db.get(user_id, [])

@router.post("/message", response_model=List[ChatMessage])
def send_chat_message(payload: SendMessageRequest):
    if payload.user_id not in _chat_db:
        _chat_db[payload.user_id] = []

    existing_history = [
        {"sender": m.sender, "text": m.text}
        for m in _chat_db[payload.user_id]
    ]

    timestamp = datetime.utcnow().isoformat()
    bot_reply_text = generate_ai_response(
        text=payload.text,
        user_name=payload.user_name,
        user_email=payload.user_email,
        user_role=payload.user_role,
        workspace_plan=payload.workspace_plan,
        chat_history=existing_history
    )

    user_msg = ChatMessage(
        id=f"msg-{len(_chat_db[payload.user_id]) + 1}",
        user_id=payload.user_id,
        sender="user",
        text=payload.text,
        topic=payload.topic,
        created_at=timestamp
    )

    bot_msg = ChatMessage(
        id=f"msg-{len(_chat_db[payload.user_id]) + 2}",
        user_id=payload.user_id,
        sender="bot",
        text=bot_reply_text,
        topic=payload.topic,
        created_at=timestamp
    )

    _chat_db[payload.user_id].extend([user_msg, bot_msg])
    return [user_msg, bot_msg]

@router.delete("/history/{user_id}")
def clear_chat_history(user_id: str):
    _chat_db[user_id] = []
    return {"status": "cleared", "user_id": user_id}

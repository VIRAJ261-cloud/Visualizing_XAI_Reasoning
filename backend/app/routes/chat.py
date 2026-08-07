from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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

@router.get("/history/{user_id}", response_model=List[ChatMessage])
def get_chat_history(user_id: str):
    return _chat_db.get(user_id, [])

@router.post("/message", response_model=List[ChatMessage])
def send_chat_message(payload: SendMessageRequest):
    if payload.user_id not in _chat_db:
        _chat_db[payload.user_id] = []
    
    timestamp = datetime.utcnow().isoformat()
    
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
        text=f"CLARIO-1 suggests a calm, secure next step for: “{payload.text}”.",
        topic=payload.topic,
        created_at=timestamp
    )
    
    _chat_db[payload.user_id].extend([user_msg, bot_msg])
    return [user_msg, bot_msg]

@router.delete("/history/{user_id}")
def clear_chat_history(user_id: str):
    _chat_db[user_id] = []
    return {"status": "cleared", "user_id": user_id}

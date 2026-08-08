import re
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

def generate_ai_response(text: str) -> str:
    clean = text.strip() if text else ""
    lower = clean.lower()

    if not clean:
        return "Hello! I'm Clario. Feel free to ask me anything!"

    # 1. Greetings & Small Talk
    if re.search(r'^(hi+|hello+|hey+|what\'?s up|greetings|good morning|good afternoon|good evening|yo)\b', lower):
        return "Hey there! I'm Clario, your AI assistant. How's it going? What can I help you with today?"

    # 2. Identity / Name
    if re.search(r'\b(who are you|your name|what\'?s your name|tell me about yourself)\b', lower):
        return "I'm Clario, a versatile AI assistant! I'm here to help answer your questions, assist with coding and analysis, brainstorm ideas, or guide you through your workspace. What would you like to work on?"

    # 3. Help & General Workspace Guidance
    if re.search(r'^(what do i do|what can you do|help|how to use|how does this work)\b', lower):
        return (
            "I'm Clario, your AI assistant! You can ask me almost anything, such as:\n\n"
            "• General knowledge and Q&A (just like ChatGPT or Gemini)\n"
            "• Coding, debugging, and data analysis\n"
            "• Explanations of complex concepts or reasoning\n"
            "• Guiding you through the trust metrics and dashboard settings\n\n"
            "What would you like to explore or work on right now?"
        )

    # 4. Gratitude / Thanks
    if re.search(r'\b(thanks|thank you|thx|awesome|cool|great)\b', lower):
        return "You're very welcome! Let me know if there's anything else I can help you with."

    # 5. Programming / Code
    if re.search(r'\b(code|python|javascript|react|html|css|sql|function|api|bug|error|script)\b', lower):
        return (
            f"I'd be happy to help with your coding question regarding: “{clean}”.\n\n"
            "Could you share a snippet of your code or specify the exact behavior or error you're encountering? "
            "I can assist with debugging, optimization, writing functions, or setting up architecture!"
        )

    # 6. Trust & XAI Specifics (Natural Response)
    if re.search(r'\b(trust score|confidence score|reasoning crystal|vector retrieval|xai)\b', lower):
        return (
            "The CLARIO-1 workspace evaluates AI predictions across multiple trust metrics, including self-consistency, "
            "semantic agreement, and source fidelity. The Reasoning Crystal on the right panel visualizes the real-time "
            "confidence of the active execution path."
        )

    # 7. General Conversational Fallback (Normal AI behavior like ChatGPT / Gemini)
    return (
        f"I'm Clario! Regarding your prompt “{clean}”:\n\n"
        "I'm ready to assist with any questions, explanations, writing, or analysis on this topic. "
        "Feel free to specify any details or key points you'd like me to focus on!"
    )

@router.get("/history/{user_id}", response_model=List[ChatMessage])
def get_chat_history(user_id: str):
    return _chat_db.get(user_id, [])

@router.post("/message", response_model=List[ChatMessage])
def send_chat_message(payload: SendMessageRequest):
    if payload.user_id not in _chat_db:
        _chat_db[payload.user_id] = []
    
    timestamp = datetime.utcnow().isoformat()
    bot_reply_text = generate_ai_response(payload.text)
    
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

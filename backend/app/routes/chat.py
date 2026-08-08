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
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = "Verified XAI Analyst"
    workspace_plan: Optional[str] = "Enterprise XAI Pro"

def generate_ai_response(
    text: str,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = "Verified XAI Analyst",
    workspace_plan: Optional[str] = "Enterprise XAI Pro"
) -> str:
    clean = text.strip() if text else ""
    lower = clean.lower()
    display_name = user_name.strip() if user_name and user_name.strip() else "Analyst"

    if not clean:
        return f"Hello {display_name}! I'm Clario. Feel free to ask me anything!"

    # 1. User Name Queries (e.g. "What is my name", "what is mmy name", "my name")
    if re.search(r'\b(what\s+is\s+m*y\s+name|what\'?s\s+m*y\s+name|do\s+you\s+know\s+my\s+name|tell\s+me\s+my\s+name)\b', lower):
        email_str = f" ({user_email.strip()})" if user_email and user_email.strip() else ""
        return f"Your name is **{display_name}**! You are signed in as {display_name}{email_str} on the {workspace_plan or 'Enterprise XAI Pro'} plan."

    # 2. Account & Profile Queries
    if re.search(r'\b(who am i|my profile|my account|my role|my details|my plan|user profile)\b', lower):
        email_str = f" ({user_email.strip()})" if user_email and user_email.strip() else ""
        return (
            f"You are currently signed in as **{display_name}**{email_str}.\n\n"
            f"• **Workspace Role:** {user_role or 'Verified XAI Analyst'}\n"
            f"• **Workspace Plan:** {workspace_plan or 'Enterprise XAI Pro'}\n\n"
            "I have access to your session profile to provide personalized responses during your chat session!"
        )

    # 3. AI Definition Queries (e.g. "what do we mean by ai", "what is ai", "define ai")
    if re.search(r'\b(what\s+(do\s+we\s+mean\s+by|is)\s+ai|define\s+ai|meaning\s+of\s+ai|artificial\s+intelligence)\b', lower):
        return (
            "**Artificial Intelligence (AI)** refers to computer systems engineered to simulate human-like cognitive abilities, "
            "including learning, reasoning, pattern recognition, and decision-making.\n\n"
            "In modern technology, AI encompasses machine learning algorithms, deep neural networks, natural language processing, "
            "and Explainable AI (XAI) platforms like **CLARIO-1** that provide transparent trust and confidence metrics."
        )

    # 4. Machine Learning & XAI Concept Definitions
    if re.search(r'\b(machine learning|ml)\b', lower):
        return (
            "**Machine Learning (ML)** is a subset of AI focused on training algorithms to learn patterns from data "
            "and make predictions without being explicitly programmed for every scenario."
        )

    if re.search(r'\b(explainable ai|xai)\b', lower):
        return (
            "**Explainable AI (XAI)** refers to tools and frameworks that make artificial intelligence decision-making processes "
            "transparent, understandable, and verifiable by human experts."
        )

    # 5. Greetings & Small Talk
    if re.search(r'^(hi+|hello+|hey+|what\'?s up|greetings|good morning|good afternoon|good evening|yo)\b', lower):
        return f"Hey there, {display_name}! I'm Clario, your AI assistant. How's it going today? What can I help you explore or answer?"

    # 6. Assistant Identity
    if re.search(r'\b(who are you|your name|what\'?s your name|tell me about yourself)\b', lower):
        return f"I'm Clario, your personalized AI assistant, {display_name}! I'm here to help answer your questions, assist with coding and analysis, brainstorm ideas, or guide you through your XAI metrics. What would you like to work on?"

    # 7. Help & Workspace Guidance
    if re.search(r'^(what do i do|what can you do|help|how to use|how does this work)\b', lower):
        return (
            f"Welcome, {display_name}! I'm Clario, your AI assistant. You can ask me almost anything, such as:\n\n"
            "• General knowledge and Q&A (just like ChatGPT or Gemini)\n"
            "• Coding, debugging, and data analysis\n"
            "• Explanations of complex concepts or reasoning\n"
            "• Guiding you through the trust metrics and dashboard settings\n\n"
            "What would you like to explore or work on right now?"
        )

    # 8. Gratitude / Thanks
    if re.search(r'\b(thanks|thank you|thx|awesome|cool|great)\b', lower):
        return f"You're very welcome, {display_name}! Let me know if there's anything else I can help you with."

    # 9. Programming / Code Queries
    if re.search(r'\b(code|python|javascript|react|html|css|sql|function|api|bug|error|script)\b', lower):
        return (
            f"I'd be happy to help you with your coding question, {display_name}, regarding: “{clean}”.\n\n"
            "Could you share a snippet of your code or specify the exact behavior or error you're encountering? "
            "I can assist with debugging, optimization, writing functions, or setting up architecture!"
        )

    # 10. Trust & XAI Specifics
    if re.search(r'\b(trust score|confidence score|reasoning crystal|vector retrieval)\b', lower):
        return (
            f"The CLARIO-1 workspace evaluates AI predictions across multiple trust metrics, {display_name}. "
            "These include self-consistency, semantic agreement, and source fidelity. The Reasoning Crystal on the right "
            "panel visualizes the real-time confidence of the active execution path."
        )

    # 11. General Concept Q&A Handler
    if lower.startswith(('what is', 'what are', 'how does', 'why does', 'explain', 'define')):
        return (
            f"Regarding **“{clean}”**, {display_name}:\n\n"
            f"This topic involves analyzing key functional principles and practical applications. "
            f"Would you like me to elaborate on specific details, technical mechanisms, or practical examples for this query?"
        )

    # 12. Conversational Fallback
    return (
        f"I'm Clario, {display_name}! Regarding “{clean}”:\n\n"
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
    bot_reply_text = generate_ai_response(
        text=payload.text,
        user_name=payload.user_name,
        user_email=payload.user_email,
        user_role=payload.user_role,
        workspace_plan=payload.workspace_plan
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

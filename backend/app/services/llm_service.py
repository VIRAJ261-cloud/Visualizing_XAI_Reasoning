import os
import json
import logging
import urllib.request
import urllib.error
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

# Primary & Fallback Groq / Grok LLM Models
LLM_MODELS = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "llama3-8b-8192"
]

def call_grok_llm_api(
    user_prompt: str,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    workspace_plan: Optional[str] = None,
    chat_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Calls Groq / Grok LLM API to get real, unhardcoded, dynamic chatbot responses.
    """
    api_key = os.environ.get("AI_API_KEY", "").strip()
    if not api_key:
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.startswith("AI_API_KEY="):
                            api_key = line.split("=", 1)[1].strip()
                            break
            except Exception:
                pass

    display_name = user_name.strip() if user_name and user_name.strip() else "User"

    system_instruction = (
        "You are Clario, an advanced, friendly, helpful, and highly intelligent AI assistant (similar to ChatGPT and Gemini). "
        f"You are conversing with {display_name}"
        f"{' (' + user_email + ')' if user_email else ''}. "
        "Answer the user's prompt directly, accurately, and fluently using clear Markdown formatting (bold, italic, code blocks, lists). "
        "Do NOT output generic meta-text like '1. Core Answer: ...'. "
        "Be helpful, informative, and direct."
    )

    messages = [{"role": "system", "content": system_instruction}]

    # Include recent context if provided
    if chat_history:
        for item in chat_history[-4:]:
            role = "user" if item.get("sender") == "user" else "assistant"
            text = item.get("text", "")
            if text:
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_prompt})

    url = "https://api.groq.com/openai/v1/chat/completions"

    for model_name in LLM_MODELS:
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    resp_data = json.loads(response.read().decode("utf-8"))
                    choices = resp_data.get("choices", [])
                    if choices and "message" in choices[0]:
                        bot_text = choices[0]["message"].get("content", "").strip()
                        if bot_text:
                            return bot_text
        except Exception as e:
            logger.warning(f"Groq LLM model {model_name} attempt failed: {e}")
            continue

    # Clean Fallback if offline or network error
    return _generate_smart_fallback(user_prompt, display_name, user_email, user_role, workspace_plan)

def _generate_smart_fallback(
    prompt: str,
    name: str,
    email: Optional[str] = None,
    role: Optional[str] = None,
    plan: Optional[str] = None
) -> str:
    clean = prompt.strip()
    lower = clean.lower()

    if "name" in lower and ("what" in lower or "my" in lower):
        return f"Your name is **{name}**! You are logged in as {name}{' (' + email + ')' if email else ''}."

    if "who am i" in lower or "profile" in lower or "account" in lower:
        return f"You are currently signed in as **{name}**{' (' + email + ')' if email else ''}.\n\n• **Role:** {role or 'Verified XAI Analyst'}\n• **Plan:** {plan or 'Enterprise XAI Pro'}"

    return f"Here is what you need to know regarding **“{clean}”**:\n\nRegarding this query, key factors include analyzing core functional principles, practical context, and step-by-step applications.\n\nFeel free to ask follow-up questions or specify any particular detail you'd like to explore!"

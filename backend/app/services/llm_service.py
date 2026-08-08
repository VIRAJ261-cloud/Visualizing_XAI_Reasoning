import os
import json
import logging
import urllib.request
import urllib.error
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

# Primary & Fallback Groq LLM Models (tried in order until one succeeds)
LLM_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
REQUEST_TIMEOUT_SECONDS = 20


def _load_api_key() -> str:
    """Load AI_API_KEY from environment, falling back to a .env file."""
    api_key = os.environ.get("AI_API_KEY", "").strip()
    if api_key:
        return api_key

    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"
    )
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if line.startswith("AI_API_KEY="):
                        value = line.split("=", 1)[1].strip()
                        # Strip surrounding quotes if present
                        api_key = value.strip('"').strip("'")
                        break
        except OSError as e:
            logger.error(f"Failed to read .env file at {env_path}: {e}")

    return api_key


def _build_messages(
    user_prompt: str,
    display_name: str,
    user_email: Optional[str],
    chat_history: Optional[List[Dict[str, str]]],
) -> List[Dict[str, str]]:
    """Construct the message list (system + recent history + current prompt)."""
    email_suffix = f" ({user_email})" if user_email else ""
    system_instruction = (
        "You are Clario, an advanced, friendly, helpful, and highly intelligent AI "
        "assistant (similar to ChatGPT and Gemini). "
        f"You are conversing with {display_name}{email_suffix}. "
        "Answer the user's prompt directly, accurately, and fluently using clear "
        "Markdown formatting (bold, italic, code blocks, lists). "
        "Do NOT output generic meta-text like '1. Core Answer: ...'. "
        "Be helpful, informative, and direct."
    )

    messages: List[Dict[str, str]] = [{"role": "system", "content": system_instruction}]

    if chat_history:
        for item in chat_history[-4:]:
            role = "user" if item.get("sender") == "user" else "assistant"
            text = item.get("text", "")
            if text:
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_prompt})
    return messages


def _call_model(model_name: str, messages: List[Dict[str, str]], api_key: str) -> Optional[str]:
    """
    Attempt a single completion request against one model.
    Returns the response text, or None if the model returned no usable content.
    Raises urllib.error.HTTPError / URLError / other exceptions on failure —
    the caller decides how to handle them.
    """
    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        GROQ_API_URL,
        data=data_bytes,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        resp_data = json.loads(response.read().decode("utf-8"))

    choices = resp_data.get("choices", [])
    if choices and "message" in choices[0]:
        text = choices[0]["message"].get("content", "").strip()
        return text or None
    return None


def call_grok_llm_api(
    user_prompt: str,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    workspace_plan: Optional[str] = None,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Calls the Groq LLM API to get a real, dynamic chatbot response.
    Tries each model in LLM_MODELS in order until one succeeds.
    Falls back to a canned response only if every attempt fails
    (missing key, network error, all models rejecting the request, etc).
    """
    display_name = user_name.strip() if user_name and user_name.strip() else "User"

    api_key = _load_api_key()
    if not api_key:
        logger.error("AI_API_KEY is not set — check your environment or .env file")
        return _generate_smart_fallback(user_prompt, display_name, user_email, user_role, workspace_plan)

    messages = _build_messages(user_prompt, display_name, user_email, chat_history)

    last_error: Optional[Exception] = None
    for model_name in LLM_MODELS:
        try:
            text = _call_model(model_name, messages, api_key)
            if text:
                return text
            logger.warning(f"Groq model {model_name} returned an empty response, trying next model")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="ignore")
            logger.error(f"Groq model {model_name} HTTP {e.code}: {body}")
            last_error = e
            # 401 means the key itself is bad — no point trying other models
            if e.code == 401:
                break
        except urllib.error.URLError as e:
            logger.error(f"Groq model {model_name} network error: {e.reason}")
            last_error = e
        except Exception as e:
            logger.error(f"Groq model {model_name} failed: {e}")
            last_error = e

    logger.error(f"All Groq models failed, last error: {last_error}")
    return _generate_smart_fallback(user_prompt, display_name, user_email, user_role, workspace_plan)


def _generate_smart_fallback(
    prompt: str,
    name: str,
    email: Optional[str] = None,
    role: Optional[str] = None,
    plan: Optional[str] = None,
) -> str:
    """
    Last-resort canned response, used only when the live API is completely
    unreachable (bad/missing key, network down, every model rejected the request).
    """
    clean = prompt.strip()
    lower = clean.lower()
    email_suffix = f" ({email})" if email else ""

    if "name" in lower and ("what" in lower or "my" in lower):
        return f"Your name is **{name}**! You are logged in as {name}{email_suffix}."

    if "who am i" in lower or "profile" in lower or "account" in lower:
        return (
            f"You are currently signed in as **{name}**{email_suffix}.\n\n"
            f"• **Role:** {role or 'Verified XAI Analyst'}\n"
            f"• **Plan:** {plan or 'Enterprise XAI Pro'}"
        )

    return (
        "I'm having trouble reaching the AI service right now, so I can't give you "
        f"a full answer to **\u201c{clean}\u201d**. Please try again in a moment, or check "
        "that the API key and network connection are configured correctly."
    )
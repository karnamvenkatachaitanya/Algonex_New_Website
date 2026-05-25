"""
LLM provider abstraction layer for Buddy.

Switch providers by changing BUDDY_LLM_PROVIDER in settings:
  - "gemini"  → Google Gemini (default)
  - "openai"  → OpenAI GPT-4
  - "anthropic" → Claude (install langchain-anthropic first)

Required env vars:
  GEMINI_API_KEY     (when using gemini)
  OPENAI_API_KEY     (when using openai)
"""

import os
from django.conf import settings

_PROVIDER = getattr(settings, "BUDDY_LLM_PROVIDER", "gemini")
_MODEL = getattr(settings, "BUDDY_LLM_MODEL", None)


def get_llm():
    """Return a LangChain chat model bound to the configured provider."""
    if _PROVIDER == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        model = _MODEL or "gemini-2.5-flash"
        api_key = os.environ.get("GEMINI_API_KEY")
        return ChatGoogleGenerativeAI(model=model, google_api_key=api_key, temperature=0.4)

    elif _PROVIDER == "openai":
        from langchain_openai import ChatOpenAI

        model = _MODEL or "gpt-4o-mini"
        return ChatOpenAI(model=model, temperature=0.4)

    elif _PROVIDER == "anthropic":
        from langchain_anthropic import ChatAnthropic  # pip install langchain-anthropic

        model = _MODEL or "claude-3-5-sonnet-20241022"
        return ChatAnthropic(model=model, temperature=0.4)

    else:
        raise ValueError(f"Unknown BUDDY_LLM_PROVIDER: '{_PROVIDER}'. Use 'gemini', 'openai', or 'anthropic'.")

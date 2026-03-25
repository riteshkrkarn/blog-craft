"""
BlogCraft AI — LLM Client Initialization
Provides pre-configured LangChain chat model instances for OpenAI and Gemini.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path, override=True)

# ─────────────────────────────────────────────
# OpenAI Models
# ─────────────────────────────────────────────

openai_fast = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY"),
)

openai_strong = ChatOpenAI(
    model="gpt-4.1-mini",
    temperature=0.3,
    api_key=os.getenv("OPENAI_API_KEY"),
)

# ─────────────────────────────────────────────
# Google Gemini Models
# ─────────────────────────────────────────────

gemini_fast = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)

gemini_strong = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.3,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)

# ─────────────────────────────────────────────
# Default aliases (swap these to switch providers)
# ─────────────────────────────────────────────

llm_fast = openai_fast        # outline, writing, minor rewrites
llm_strong = openai_strong    # scoring, complex rewrites

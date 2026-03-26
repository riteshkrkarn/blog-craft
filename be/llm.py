"""
BlogCraft AI — LLM Client Initialization
Routes all model calls through Metric AI proxy clients.
"""

import asyncio
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from metric_setup import metric_client


class MetricProxyLLM:
    def __init__(self, provider: str, model: str, temperature: float):
        self.provider = provider
        self.model = model
        self.temperature = temperature

    def _messages_to_payload(self, messages):
        payload = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                role = "system"
            elif isinstance(msg, HumanMessage):
                role = "user"
            else:
                role = "assistant"
            payload.append({"role": role, "content": msg.content})
        return payload

    def invoke(self, messages):
        payload = self._messages_to_payload(messages)

        if self.provider == "gemini":
            response = metric_client.proxy.gemini.generate_content(
                model=self.model,
                messages=payload,
            )
            completion_text = getattr(response, "completion_text", None) or str(response)
            return AIMessage(content=completion_text)

        response = metric_client.proxy.openai.chat_completions(
            model=self.model,
            messages=payload,
            temperature=self.temperature,
        )
        completion_text = getattr(response, "completion_text", None) or str(response)
        return AIMessage(content=completion_text)

    async def ainvoke(self, messages):
        return await asyncio.to_thread(self.invoke, messages)

# ─────────────────────────────────────────────
# OpenAI Models
# ─────────────────────────────────────────────

openai_fast = MetricProxyLLM(
    provider="openai",
    model="gpt-4o-mini",
    temperature=0.7,
)

openai_strong = MetricProxyLLM(
    provider="openai",
    model="gpt-4.1-mini",
    temperature=0.3,
)

# ─────────────────────────────────────────────
# Google Gemini Models
# ─────────────────────────────────────────────

gemini_fast = MetricProxyLLM(
    provider="gemini",
    model="gemini-2.5-flash",
    temperature=0.7,
)

gemini_strong = MetricProxyLLM(
    provider="gemini",
    model="gemini-2.5-pro",
    temperature=0.3,
)

# ─────────────────────────────────────────────
# Default aliases (swap these to switch providers)
# ─────────────────────────────────────────────

llm_fast = openai_fast        # outline, writing, minor rewrites
llm_strong = openai_strong    # scoring, complex rewrites

# BlogCraft AI — Tech Stack

## Backend
- **FastAPI** — async, lightweight, pairs naturally with LangGraph (both Python)
- **LangChain** — tool abstractions, prompt templates, structured output parsing

## LLM Models
- **GPT-4o-mini** — outline generation, paragraph writing, minor rewrites (cheap, fast)
- **GPT-4o** — scoring/judging, complex rewrites when progression fails (expensive, accurate)
- **Why OpenAI**: best structured JSON output support (critical for scoring node)

## Search & Research (optional toggle)
- **Tavily API** — built-in LangChain integration, returns clean results (no scraping headaches)
- Free tier: 1000 searches/month (enough for demo)

## State & Memory
- **MongoDB** — project storage, draft versions, score history, iteration logs
- **LangGraph checkpointer** — workflow state persistence (built-in, use MongoDB-backed or in-memory for demo)

## Observability & Billing
- **MetricAI** — unified billing layer with markup management
  - Tracks token usage per node (outline, writing, scoring, rewrite)
  - Adds provider cost + markup + platform fee per generation
  - Monitors workflow-level cost (total cost per blog generated)
  - Logs agent execution metrics (iterations, tool calls, model usage per step)

## Deployment
- **Vercel** — React frontend
- **Railway/Render** — FastAPI backend (free tier works)

## Dev Tools
- **Pydantic** — structured output schemas for scoring, outlines, rewrite plans
- **LangSmith** (optional) — trace agent runs during development (debugging)

## What you DON'T need
- No vector DB (no RAG needed)
- No Redis (state lives in LangGraph checkpointer)
- No Celery/queue (FastAPI async handles the load)
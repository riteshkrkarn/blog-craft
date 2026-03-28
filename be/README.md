# BlogCraft Backend

Backend for BlogCraft built with FastAPI, LangGraph, and LLM integrations.

## Requirements

- Python 3.13
- pip (or uv)

## Install

````bash
pip install -r requirements.txt```

## Environment

Create `be/.env` with required keys:

```env
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
METRICAI_API_KEY=...
METRICAI_FIREBASE_TOKEN=...
````

## Run Locally

```bash
uvicorn main:app --reload --port 8000
```

## Deploy (Render)

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

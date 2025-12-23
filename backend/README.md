# The Unsaid - Backend API

FastAPI backend for AI articulation assistance.

## Setup

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e ".[dev]"

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the server
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

| Endpoint               | Method | Description                |
| ---------------------- | ------ | -------------------------- |
| `/health`              | GET    | Health check               |
| `/api/ai/clarify`      | POST   | Get clarity suggestions    |
| `/api/ai/alternatives` | POST   | Get alternative phrasings  |
| `/api/ai/tone`         | POST   | Get tone-adjusted versions |
| `/api/ai/expand`       | POST   | Get expansion questions    |
| `/api/ai/opening`      | POST   | Get opening suggestions    |

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `OPENROUTER_DEFAULT_MODEL` - Default model (default: anthropic/claude-3-haiku)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `AI_RATE_LIMIT_PER_HOUR` - Rate limit per user (default: 10)

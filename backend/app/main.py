# ===========================================
# THE UNSAID - FastAPI Backend
# ===========================================
import os
from contextlib import asynccontextmanager
from pathlib import Path

# Load environment from root .env (one level up from backend/)
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent.parent.parent / ".env", override=True)

from app.middleware.rate_limit import RateLimitMiddleware
from app.routers import ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 The Unsaid API starting...")
    yield
    # Shutdown
    print("👋 The Unsaid API shutting down...")


app = FastAPI(
    title="The Unsaid API",
    description="AI articulation assistant for meaningful communication",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# CORS configuration
# Check PUBLIC_APP_URL first (aligned with frontend), fall back to FRONTEND_URL for backward compatibility
def normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/")


def parse_origins(value: str | None) -> list[str]:
    if not value:
        return []
    return [normalize_origin(origin) for origin in value.split(",") if origin.strip()]


frontend_origins = parse_origins(os.getenv("PUBLIC_APP_URL"))
frontend_origins.extend(parse_origins(os.getenv("FRONTEND_URL")))
allow_origins = frontend_origins or ["http://localhost:5173"]

# Add localhost variants if in development
if os.getenv("NODE_ENV", "development") == "development":
    allow_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173", "http://0.0.0.0:5173"])
    # Deduplicate
    allow_origins = list({normalize_origin(origin) for origin in allow_origins if origin})

print(f"CORS Allowed Origins: {allow_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "the-unsaid-api"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "The Unsaid API",
        "docs": "/docs",
        "health": "/health",
    }

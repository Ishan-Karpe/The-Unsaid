# ===========================================
# THE UNSAID - FastAPI Backend
# ===========================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import os

# Load environment from root .env (one level up from backend/)
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent / ".env")

from app.routers import ai
from app.middleware.rate_limit import RateLimitMiddleware


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

# CORS configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

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

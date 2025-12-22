# ===========================================
# THE UNSAID - Rate Limiting Middleware
# ===========================================
import os
import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting for AI endpoints
    In production, use Redis for distributed rate limiting
    """

    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.limit = int(os.getenv("AI_RATE_LIMIT_PER_HOUR", "10"))
        self.window = 3600  # 1 hour in seconds

    async def dispatch(self, request: Request, call_next):
        # Only rate limit AI endpoints
        if not request.url.path.startswith("/api/ai"):
            return await call_next(request)

        # Get user identifier (IP for now, could use JWT user_id)
        client_ip = request.client.host if request.client else "unknown"

        # Clean old requests
        current_time = time.time()
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < self.window
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.limit:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {self.limit} AI requests per hour."
            )

        # Record this request
        self.requests[client_ip].append(current_time)

        return await call_next(request)

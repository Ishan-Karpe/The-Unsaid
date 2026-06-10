# ===========================================
# THE UNSAID - Rate Limiting Middleware
# ===========================================
import base64
import binascii
import json
import os
import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


def _jwt_subject(authorization: str | None) -> str | None:
    """
    Extract the `sub` claim from a Bearer JWT without verifying the signature.

    This is only used to bucket rate-limit counters per user; actual
    authentication happens downstream in the auth middleware. A forged
    token just rate-limits the forger under their own bogus bucket.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    parts = authorization[7:].split(".")
    if len(parts) != 3:
        return None
    try:
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        claims = json.loads(base64.urlsafe_b64decode(payload))
        sub = claims.get("sub")
        return str(sub) if sub else None
    except (ValueError, binascii.Error):
        return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting for AI endpoints, keyed by authenticated
    user (JWT `sub`) with IP fallback for unauthenticated requests.

    Note: counters are per-process; a multi-instance deployment would need a
    shared store (e.g. Redis) for global limits.
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

        # Ignore OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Prefer the authenticated user id; fall back to client IP
        user_id = _jwt_subject(request.headers.get("authorization"))
        client_ip = user_id or (request.client.host if request.client else "unknown")

        # Clean old requests
        current_time = time.time()
        self.requests[client_ip] = [
            req_time
            for req_time in self.requests[client_ip]
            if current_time - req_time < self.window
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded. Maximum {self.limit} AI requests per hour."
                },
            )

        # Record this request
        self.requests[client_ip].append(current_time)

        return await call_next(request)

# ===========================================
# THE UNSAID - AI Router
# ===========================================
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user, verify_ai_consent
from app.models.ai import (
    AIResponse,
    AlternativesRequest,
    ClarifyRequest,
    ExpandRequest,
    OpeningRequest,
    ToneRequest,
)
from app.services.openrouter import (
    AIConfigError,
    AIRateLimitError,
    AIServiceError,
    AITimeoutError,
    OpenRouterService,
)

logger = logging.getLogger(__name__)
router = APIRouter()
ai_service = OpenRouterService()


def handle_ai_error(e: Exception) -> HTTPException:
    """Convert AI service errors to appropriate HTTP exceptions"""
    if isinstance(e, AIRateLimitError):
        return HTTPException(status_code=429, detail=e.message)
    elif isinstance(e, AITimeoutError):
        return HTTPException(status_code=504, detail=e.message)
    elif isinstance(e, AIConfigError):
        # Don't expose config details to client
        return HTTPException(status_code=503, detail="AI service is temporarily unavailable.")
    elif isinstance(e, AIServiceError):
        status_code = 503 if e.retryable else 500
        return HTTPException(status_code=status_code, detail=e.message)
    else:
        logger.error(f"Unexpected AI error: {type(e).__name__}: {e}")
        return HTTPException(
            status_code=500, detail="An unexpected error occurred. Please try again."
        )


@router.post("/clarify", response_model=AIResponse)
async def clarify(
    request: ClarifyRequest,
    user_id: str = Depends(get_current_user),
    _: bool = Depends(verify_ai_consent),
):
    """Get clarity suggestions for a draft"""
    try:
        result = await ai_service.clarify(
            draft_text=request.draft_text,
            recipient=request.recipient,
            intent=request.intent,
        )
        return result
    except Exception as e:
        raise handle_ai_error(e)


@router.post("/alternatives", response_model=AIResponse)
async def alternatives(
    request: AlternativesRequest,
    user_id: str = Depends(get_current_user),
    _: bool = Depends(verify_ai_consent),
):
    """Get alternative phrasings for a draft"""
    try:
        result = await ai_service.alternatives(
            draft_text=request.draft_text,
            recipient=request.recipient,
            intent=request.intent,
        )
        return result
    except Exception as e:
        raise handle_ai_error(e)


@router.post("/tone", response_model=AIResponse)
async def tone(
    request: ToneRequest,
    user_id: str = Depends(get_current_user),
    _: bool = Depends(verify_ai_consent),
):
    """Get tone-adjusted versions of a draft"""
    try:
        result = await ai_service.tone(
            draft_text=request.draft_text,
            recipient=request.recipient,
            intent=request.intent,
        )
        return result
    except Exception as e:
        raise handle_ai_error(e)


@router.post("/expand", response_model=AIResponse)
async def expand(
    request: ExpandRequest,
    user_id: str = Depends(get_current_user),
    _: bool = Depends(verify_ai_consent),
):
    """Get expansion questions for a draft"""
    try:
        result = await ai_service.expand(
            draft_text=request.draft_text,
            recipient=request.recipient,
            intent=request.intent,
        )
        return result
    except Exception as e:
        raise handle_ai_error(e)


@router.post("/opening", response_model=AIResponse)
async def opening(
    request: OpeningRequest,
    user_id: str = Depends(get_current_user),
    _: bool = Depends(verify_ai_consent),
):
    """Get opening sentence suggestions"""
    try:
        result = await ai_service.opening(
            draft_text=request.draft_text,
            recipient=request.recipient,
            intent=request.intent,
        )
        return result
    except Exception as e:
        raise handle_ai_error(e)

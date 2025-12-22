# ===========================================
# THE UNSAID - AI Router
# ===========================================
from fastapi import APIRouter, Depends, HTTPException
from app.models.ai import (
    ClarifyRequest,
    AlternativesRequest,
    ToneRequest,
    ExpandRequest,
    OpeningRequest,
    AIResponse,
)
from app.services.openrouter import OpenRouterService
from app.middleware.auth import get_current_user, verify_ai_consent

router = APIRouter()
ai_service = OpenRouterService()


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))

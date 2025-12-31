# ===========================================
# THE UNSAID - Pydantic Models for AI
# ===========================================

from pydantic import BaseModel, Field


class AIOption(BaseModel):
    """A single AI suggestion option"""

    text: str = Field(..., description="The suggested text")
    why: str = Field(..., description="Explanation of why this works")


class AIResponse(BaseModel):
    """Response from AI endpoints"""

    options: list[AIOption] = Field(..., description="List of suggestions")
    original_valid: bool = Field(default=True, description="Whether original text is valid")


# Request models for each AI mode
class BaseAIRequest(BaseModel):
    """Base request for all AI endpoints"""

    draft_text: str = Field(..., min_length=1, max_length=10000, description="The draft text")
    recipient: str = Field(..., min_length=1, max_length=100, description="Who the message is for")
    intent: str = Field(..., min_length=1, max_length=500, description="What to express")


class ClarifyRequest(BaseAIRequest):
    """Request for clarity enhancement"""

    pass


class AlternativesRequest(BaseAIRequest):
    """Request for alternative phrasings"""

    pass


class ToneRequest(BaseAIRequest):
    """Request for tone calibration"""

    target_tone: str | None = Field(
        default=None, description="Desired tone (softer, warmer, direct)"
    )


class ExpandRequest(BaseAIRequest):
    """Request for expansion prompts"""

    pass


class OpeningRequest(BaseAIRequest):
    """Request for opening suggestions"""

    pass

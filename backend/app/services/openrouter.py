# ===========================================
# THE UNSAID - OpenRouter AI Service
# ===========================================
import logging
import os

import httpx

from app.models.ai import AIOption, AIResponse
from app.prompts.base import (
    ALTERNATIVES_PROMPT,
    CLARIFY_PROMPT,
    EXPAND_PROMPT,
    OPENING_PROMPT,
    SYSTEM_PROMPT,
    TONE_PROMPT,
)

logger = logging.getLogger(__name__)


# ===========================================
# Custom Exceptions
# ===========================================
class AIServiceError(Exception):
    """Base exception for AI service errors"""

    def __init__(self, message: str, error_type: str = "unknown", retryable: bool = False):
        super().__init__(message)
        self.message = message
        self.error_type = error_type
        self.retryable = retryable


class AIRateLimitError(AIServiceError):
    """Rate limit exceeded"""

    def __init__(self, message: str = "AI service rate limit exceeded. Please wait a moment."):
        super().__init__(message, error_type="rate_limit", retryable=True)


class AITimeoutError(AIServiceError):
    """Request timed out"""

    def __init__(self, message: str = "AI request timed out. Please try again."):
        super().__init__(message, error_type="timeout", retryable=True)


class AIProviderError(AIServiceError):
    """Error from the AI provider (OpenRouter)"""

    def __init__(self, message: str = "AI service is temporarily unavailable."):
        super().__init__(message, error_type="provider_error", retryable=True)


class AIConfigError(AIServiceError):
    """Configuration error"""

    def __init__(self, message: str = "AI service is not properly configured."):
        super().__init__(message, error_type="config_error", retryable=False)


class AIParsingError(AIServiceError):
    """Error parsing AI response"""

    def __init__(self, message: str = "Failed to parse AI response."):
        super().__init__(message, error_type="parsing_error", retryable=True)


class OpenRouterService:
    """Service for interacting with OpenRouter API"""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("OPENROUTER_DEFAULT_MODEL", "anthropic/claude-3-haiku")
        self.base_url = "https://openrouter.ai/api/v1"

        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")

    async def _call_llm(
        self,
        user_prompt: str,
        recipient: str,
        intent: str,
    ) -> str:
        """Make a call to the OpenRouter API with improved error handling"""
        system_prompt = SYSTEM_PROMPT.format(recipient=recipient, intent=intent)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": os.getenv("FRONTEND_URL", "http://localhost:5173"),
                        "X-Title": "The Unsaid",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "max_tokens": 500,
                        "temperature": 0.7,
                    },
                    timeout=30.0,
                )

                # Handle specific HTTP errors
                if response.status_code == 429:
                    logger.warning("OpenRouter rate limit exceeded")
                    raise AIRateLimitError()
                elif response.status_code == 401:
                    logger.error("Invalid OpenRouter API key")
                    raise AIConfigError("AI service authentication failed. Please contact support.")
                elif response.status_code == 402:
                    logger.error("OpenRouter payment required")
                    raise AIProviderError("AI service payment required. Please contact support.")
                elif response.status_code >= 500:
                    logger.error(f"OpenRouter server error: {response.status_code}")
                    raise AIProviderError(
                        "AI service is experiencing issues. Please try again later."
                    )
                elif not response.is_success:
                    logger.error(f"OpenRouter error: {response.status_code} - {response.text}")
                    raise AIProviderError(f"AI service returned error: {response.status_code}")

                data = response.json()

                # Validate response structure
                if "choices" not in data or len(data["choices"]) == 0:
                    logger.error(f"Invalid OpenRouter response: {data}")
                    raise AIParsingError("AI service returned an invalid response.")

                content = data["choices"][0].get("message", {}).get("content")
                if not content:
                    logger.error(f"Empty content in OpenRouter response: {data}")
                    raise AIParsingError("AI service returned empty content.")

                return content

        except httpx.TimeoutException as e:
            logger.error(f"OpenRouter timeout: {e}")
            raise AITimeoutError("AI request took too long. Please try again.")
        except httpx.ConnectError as e:
            logger.error(f"OpenRouter connection error: {e}")
            raise AIProviderError(
                "Unable to connect to AI service. Check your internet connection."
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenRouter HTTP error: {e}")
            if e.response.status_code == 429:
                raise AIRateLimitError()
            raise AIProviderError(f"AI service error: {e.response.status_code}")
        except AIServiceError:
            # Re-raise our custom exceptions
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling OpenRouter: {type(e).__name__}: {e}")
            raise AIServiceError(
                message="An unexpected error occurred. Please try again.",
                error_type="unknown",
                retryable=True,
            )

    def _parse_options(self, response_text: str) -> list[AIOption]:
        """Parse LLM response into structured options"""
        options = []
        lines = response_text.strip().split("\n")

        current_text = ""
        current_why = ""

        for line in lines:
            line = line.strip()
            if line.startswith(("Option 1:", "Option 2:", "Option 3:", "1.", "2.", "3.")):
                if current_text:
                    options.append(
                        AIOption(text=current_text, why=current_why or "A valid alternative")
                    )
                # Extract text after the label
                current_text = line.split(":", 1)[-1].strip() if ":" in line else line[2:].strip()
                current_why = ""
            elif line.lower().startswith("why:"):
                current_why = line[4:].strip()

        # Add last option
        if current_text:
            options.append(AIOption(text=current_text, why=current_why or "A valid alternative"))

        # Fallback if parsing failed
        if not options:
            options = [AIOption(text=response_text[:500], why="AI suggestion")]

        return options[:3]  # Max 3 options

    async def clarify(self, draft_text: str, recipient: str, intent: str) -> AIResponse:
        """Get clarity suggestions"""
        prompt = CLARIFY_PROMPT.format(draft_text=draft_text)
        response = await self._call_llm(prompt, recipient, intent)
        return AIResponse(options=self._parse_options(response), original_valid=True)

    async def alternatives(self, draft_text: str, recipient: str, intent: str) -> AIResponse:
        """Get alternative phrasings"""
        prompt = ALTERNATIVES_PROMPT.format(draft_text=draft_text)
        response = await self._call_llm(prompt, recipient, intent)
        return AIResponse(options=self._parse_options(response), original_valid=True)

    async def tone(self, draft_text: str, recipient: str, intent: str) -> AIResponse:
        """Get tone-adjusted versions"""
        prompt = TONE_PROMPT.format(draft_text=draft_text)
        response = await self._call_llm(prompt, recipient, intent)
        return AIResponse(options=self._parse_options(response), original_valid=True)

    async def expand(self, draft_text: str, recipient: str, intent: str) -> AIResponse:
        """Get expansion questions"""
        prompt = EXPAND_PROMPT.format(draft_text=draft_text)
        response = await self._call_llm(prompt, recipient, intent)
        return AIResponse(options=self._parse_options(response), original_valid=True)

    async def opening(self, draft_text: str, recipient: str, intent: str) -> AIResponse:
        """Get opening suggestions"""
        prompt = OPENING_PROMPT.format(draft_text=draft_text, recipient=recipient, intent=intent)
        response = await self._call_llm(prompt, recipient, intent)
        return AIResponse(options=self._parse_options(response), original_valid=True)

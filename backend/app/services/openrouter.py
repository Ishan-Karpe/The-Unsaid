# ===========================================
# THE UNSAID - OpenRouter AI Service
# ===========================================
import os
import httpx
from typing import Optional
from app.models.ai import AIResponse, AIOption
from app.prompts.base import (
    SYSTEM_PROMPT,
    CLARIFY_PROMPT,
    ALTERNATIVES_PROMPT,
    TONE_PROMPT,
    EXPAND_PROMPT,
    OPENING_PROMPT,
)


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
        """Make a call to the OpenRouter API"""
        system_prompt = SYSTEM_PROMPT.format(recipient=recipient, intent=intent)

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
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

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
                    options.append(AIOption(text=current_text, why=current_why or "A valid alternative"))
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

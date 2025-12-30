# ===========================================
# THE UNSAID - OpenRouter Service Tests
# ===========================================
# Tests for the OpenRouter API integration service

import os
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest


class TestOpenRouterServiceInit:
    """Tests for OpenRouterService initialization"""

    def test_service_requires_api_key(self):
        """Should raise error when API key is missing"""
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": ""}, clear=False):
            # Need to reload the module to test initialization
            with pytest.raises(ValueError, match="OPENROUTER_API_KEY"):
                # Force reimport to test init
                import importlib

                import app.services.openrouter as openrouter_module

                importlib.reload(openrouter_module)
                openrouter_module.OpenRouterService()

    def test_service_uses_default_model(self):
        """Should use default model when not specified"""
        with patch.dict(
            os.environ,
            {"OPENROUTER_API_KEY": "test-key", "OPENROUTER_DEFAULT_MODEL": ""},
            clear=False,
        ):
            from app.services.openrouter import OpenRouterService

            service = OpenRouterService()
            # Default is anthropic/claude-3-haiku
            assert "haiku" in service.model.lower() or "claude" in service.model.lower()


class TestOpenRouterServiceParsing:
    """Tests for response parsing logic"""

    @pytest.fixture
    def service(self):
        """Create a service instance with test API key"""
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
            from app.services.openrouter import OpenRouterService

            return OpenRouterService()

    def test_parse_numbered_options(self, service):
        """Should parse numbered options correctly"""
        response_text = """
        1. "I felt hurt when you said that"
        Why: This is clearer and focuses on your feelings

        2. "Your words caused me pain"
        Why: More direct expression

        3. "When you said that, I felt hurt"
        Why: Adds context about the trigger
        """

        options = service._parse_options(response_text)

        assert len(options) >= 2
        for option in options:
            assert hasattr(option, "text")
            assert hasattr(option, "why")
            assert len(option.text) > 0

    def test_parse_option_label_format(self, service):
        """Should parse Option 1/2/3 format"""
        response_text = """
        Option 1: This is the first suggestion
        Why: It's clearer

        Option 2: This is the second suggestion
        Why: It's more direct
        """

        options = service._parse_options(response_text)

        assert len(options) >= 2

    def test_parse_empty_response(self, service):
        """Should handle empty response gracefully"""
        options = service._parse_options("")

        # Should return at least one fallback option
        assert isinstance(options, list)

    def test_parse_malformed_response(self, service):
        """Should handle malformed response"""
        response_text = "This is not in the expected format at all."

        options = service._parse_options(response_text)

        # Should return the raw text as a fallback
        assert isinstance(options, list)
        assert len(options) >= 1

    def test_max_three_options(self, service):
        """Should limit to 3 options maximum"""
        response_text = """
        1. First option
        Why: reason
        2. Second option
        Why: reason
        3. Third option
        Why: reason
        4. Fourth option (should be ignored)
        Why: reason
        5. Fifth option (should be ignored)
        Why: reason
        """

        options = service._parse_options(response_text)

        assert len(options) <= 3


class TestOpenRouterServiceAPICall:
    """Tests for OpenRouter API interactions"""

    @pytest.fixture
    def service(self):
        """Create a service instance"""
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
            from app.services.openrouter import OpenRouterService

            return OpenRouterService()

    @pytest.mark.asyncio
    async def test_clarify_success(self, service):
        """Should return AIResponse for clarify mode"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": """
                        1. "I felt hurt by those words"
                        Why: This is clearer

                        2. "When you said that, I felt pain"
                        Why: Focuses on impact
                        """
                    }
                }
            ]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await service.clarify(
                draft_text="You hurt me",
                recipient="friend",
                intent="express feelings",
            )

            assert hasattr(result, "options")
            assert hasattr(result, "original_valid")
            assert result.original_valid is True
            assert len(result.options) >= 1

    @pytest.mark.asyncio
    async def test_alternatives_success(self, service):
        """Should return AIResponse for alternatives mode"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Option 1: Alt 1\nWhy: reason"}}]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await service.alternatives(
                draft_text="I need you to understand",
                recipient="parent",
                intent="communicate",
            )

            assert hasattr(result, "options")

    @pytest.mark.asyncio
    async def test_tone_success(self, service):
        """Should return AIResponse for tone mode"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Option 1: Softer\nWhy: gentler"}}]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await service.tone(
                draft_text="You're being unreasonable",
                recipient="partner",
                intent="address conflict",
            )

            assert hasattr(result, "options")

    @pytest.mark.asyncio
    async def test_expand_success(self, service):
        """Should return AIResponse for expand mode"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "1. What triggered this?\nWhy: Explores cause"}}]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await service.expand(
                draft_text="I'm upset",
                recipient="therapist",
                intent="process feelings",
            )

            assert hasattr(result, "options")

    @pytest.mark.asyncio
    async def test_opening_success(self, service):
        """Should return AIResponse for opening mode"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "1. I wanted to talk\nWhy: Gentle"}}]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            result = await service.opening(
                draft_text="",
                recipient="boss",
                intent="deliver news",
            )

            assert hasattr(result, "options")

    @pytest.mark.asyncio
    async def test_api_error_handling(self, service):
        """Should raise exception on API error"""
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.HTTPStatusError(
                "API Error",
                request=MagicMock(),
                response=MagicMock(status_code=500),
            )

            with pytest.raises(httpx.HTTPStatusError):
                await service.clarify(
                    draft_text="Test",
                    recipient="friend",
                    intent="express",
                )

    @pytest.mark.asyncio
    async def test_timeout_handling(self, service):
        """Should handle timeout errors"""
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.TimeoutException("Request timed out")

            with pytest.raises(httpx.TimeoutException):
                await service.clarify(
                    draft_text="Test",
                    recipient="friend",
                    intent="express",
                )


class TestOpenRouterServiceHeaders:
    """Tests for request headers"""

    @pytest.fixture
    def service(self):
        """Create a service instance"""
        with patch.dict(
            os.environ,
            {
                "OPENROUTER_API_KEY": "test-key",
                "FRONTEND_URL": "https://theunsaid.app",
            },
        ):
            from app.services.openrouter import OpenRouterService

            return OpenRouterService()

    @pytest.mark.asyncio
    async def test_sends_correct_headers(self, service):
        """Should send authorization and required headers"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "1. Test\nWhy: reason"}}]
        }
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response

            await service.clarify(
                draft_text="Test",
                recipient="friend",
                intent="express",
            )

            # Check that post was called
            mock_post.assert_called_once()

            # Get the call args
            call_kwargs = mock_post.call_args.kwargs
            headers = call_kwargs.get("headers", {})

            assert "Authorization" in headers
            assert headers["Authorization"].startswith("Bearer ")
            assert "Content-Type" in headers
            assert headers["Content-Type"] == "application/json"

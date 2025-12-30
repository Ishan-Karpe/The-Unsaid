# ===========================================
# THE UNSAID - AI Endpoint Tests
# ===========================================
# Tests for /api/ai/* endpoints
# Covers: clarify, alternatives, tone, expand, opening

from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import status

from app.models.ai import AIOption, AIResponse


class TestClarifyEndpoint:
    """Tests for POST /api/ai/clarify"""

    def test_clarify_success(self, client, mock_supabase_consent, valid_auth_header, sample_clarify_request):
        """Should return AI suggestions for clarifying text"""
        mock_response = AIResponse(
            options=[
                AIOption(text="I felt hurt when you said that", why="This is clearer"),
                AIOption(text="Your words caused me pain", why="More direct"),
            ],
            original_valid=True,
        )

        with patch("app.routers.ai.ai_service.clarify", new_callable=AsyncMock) as mock_clarify:
            mock_clarify.return_value = mock_response

            response = client.post(
                "/api/ai/clarify",
                json=sample_clarify_request,
                headers=valid_auth_header,
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "options" in data
            assert len(data["options"]) == 2
            assert data["original_valid"] is True

    def test_clarify_missing_auth(self, client, sample_clarify_request):
        """Should return 422 when Authorization header is missing"""
        response = client.post("/api/ai/clarify", json=sample_clarify_request)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_clarify_invalid_auth_format(self, client, sample_clarify_request):
        """Should return 401 when auth header format is invalid"""
        with patch("app.middleware.auth.supabase") as mock_supabase:
            mock_supabase.auth.get_user.return_value = MagicMock(user=None)

            response = client.post(
                "/api/ai/clarify",
                json=sample_clarify_request,
                headers={"Authorization": "InvalidFormat token"},
            )
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_clarify_missing_draft_text(self, client, mock_supabase_consent, valid_auth_header):
        """Should return 422 when draft_text is missing"""
        response = client.post(
            "/api/ai/clarify",
            json={"recipient": "friend", "intent": "express"},
            headers=valid_auth_header,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_clarify_empty_draft_text(self, client, mock_supabase_consent, valid_auth_header):
        """Should return 422 when draft_text is empty"""
        response = client.post(
            "/api/ai/clarify",
            json={"draft_text": "", "recipient": "friend", "intent": "express"},
            headers=valid_auth_header,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestToneEndpoint:
    """Tests for POST /api/ai/tone"""

    def test_tone_success(self, client, mock_supabase_consent, valid_auth_header, sample_tone_request):
        """Should return tone analysis suggestions"""
        mock_response = AIResponse(
            options=[
                AIOption(text="I notice this happens often", why="Softer delivery"),
                AIOption(text="When this happens, I feel frustrated", why="More vulnerable"),
            ],
            original_valid=True,
        )

        with patch("app.routers.ai.ai_service.tone", new_callable=AsyncMock) as mock_tone:
            mock_tone.return_value = mock_response

            response = client.post(
                "/api/ai/tone",
                json=sample_tone_request,
                headers=valid_auth_header,
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "options" in data
            assert len(data["options"]) == 2


class TestAlternativesEndpoint:
    """Tests for POST /api/ai/alternatives"""

    def test_alternatives_success(
        self, client, mock_supabase_consent, valid_auth_header, sample_alternatives_request
    ):
        """Should return alternative phrasings"""
        mock_response = AIResponse(
            options=[
                AIOption(text="I want to share something with you", why="Warmer approach"),
                AIOption(text="Can we talk about how I'm doing?", why="Invites dialogue"),
            ],
            original_valid=True,
        )

        with patch("app.routers.ai.ai_service.alternatives", new_callable=AsyncMock) as mock_alternatives:
            mock_alternatives.return_value = mock_response

            response = client.post(
                "/api/ai/alternatives",
                json=sample_alternatives_request,
                headers=valid_auth_header,
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "options" in data


class TestExpandEndpoint:
    """Tests for POST /api/ai/expand"""

    def test_expand_success(self, client, mock_supabase_consent, valid_auth_header, sample_expand_request):
        """Should return expanded versions of brief text"""
        mock_response = AIResponse(
            options=[
                AIOption(text="What specifically triggered this feeling?", why="Explores the cause"),
                AIOption(text="When did you first notice feeling this way?", why="Adds context"),
            ],
            original_valid=True,
        )

        with patch("app.routers.ai.ai_service.expand", new_callable=AsyncMock) as mock_expand:
            mock_expand.return_value = mock_response

            response = client.post(
                "/api/ai/expand",
                json=sample_expand_request,
                headers=valid_auth_header,
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "options" in data


class TestOpeningEndpoint:
    """Tests for POST /api/ai/opening"""

    def test_opening_success(self, client, mock_supabase_consent, valid_auth_header, sample_opening_request):
        """Should return opening line suggestions"""
        # Opening endpoint requires at least 1 char for draft_text
        request = {**sample_opening_request, "draft_text": "I need to tell you something important."}

        mock_response = AIResponse(
            options=[
                AIOption(text="There's something I've been meaning to share", why="Gentle opening"),
                AIOption(text="I wanted to talk to you about something", why="Direct approach"),
            ],
            original_valid=True,
        )

        with patch("app.routers.ai.ai_service.opening", new_callable=AsyncMock) as mock_opening:
            mock_opening.return_value = mock_response

            response = client.post(
                "/api/ai/opening",
                json=request,
                headers=valid_auth_header,
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "options" in data


class TestConsentVerification:
    """Tests for AI consent middleware"""

    def test_no_consent_returns_403(self, client, valid_auth_header, sample_clarify_request):
        """Should return 403 when user hasn't consented to AI"""
        with patch("app.middleware.auth.supabase") as mock_supabase:
            # Mock auth to succeed
            mock_user = MagicMock()
            mock_user.id = "test-user-id-12345"
            mock_auth_response = MagicMock()
            mock_auth_response.user = mock_user
            mock_supabase.auth.get_user.return_value = mock_auth_response

            # Mock preferences to return ai_enabled=False
            mock_prefs_response = MagicMock()
            mock_prefs_response.data = {"ai_enabled": False}

            mock_table = MagicMock()
            mock_supabase.table.return_value = mock_table
            mock_table.select.return_value.eq.return_value.single.return_value.execute.return_value = (
                mock_prefs_response
            )

            response = client.post(
                "/api/ai/clarify",
                json=sample_clarify_request,
                headers=valid_auth_header,
            )

            assert response.status_code == status.HTTP_403_FORBIDDEN
            assert "consent" in response.json().get("detail", "").lower()

    def test_no_preferences_returns_403(self, client, valid_auth_header, sample_clarify_request):
        """Should return 403 when user has no preferences record"""
        with patch("app.middleware.auth.supabase") as mock_supabase:
            # Mock auth to succeed
            mock_user = MagicMock()
            mock_user.id = "test-user-id-12345"
            mock_auth_response = MagicMock()
            mock_auth_response.user = mock_user
            mock_supabase.auth.get_user.return_value = mock_auth_response

            # Mock preferences table to raise exception (no record)
            mock_table = MagicMock()
            mock_supabase.table.return_value = mock_table
            mock_table.select.return_value.eq.return_value.single.return_value.execute.side_effect = Exception(
                "No rows returned"
            )

            response = client.post(
                "/api/ai/clarify",
                json=sample_clarify_request,
                headers=valid_auth_header,
            )

            assert response.status_code == status.HTTP_403_FORBIDDEN


class TestValidation:
    """Tests for request validation"""

    def test_draft_text_too_long(self, client, mock_supabase_consent, valid_auth_header):
        """Should return 422 when draft_text exceeds max length"""
        response = client.post(
            "/api/ai/clarify",
            json={
                "draft_text": "x" * 10001,  # Exceeds 10000 char limit
                "recipient": "friend",
                "intent": "express",
            },
            headers=valid_auth_header,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_missing_recipient(self, client, mock_supabase_consent, valid_auth_header):
        """Should return 422 when recipient is missing"""
        response = client.post(
            "/api/ai/clarify",
            json={"draft_text": "I feel hurt", "intent": "express"},
            headers=valid_auth_header,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_missing_intent(self, client, mock_supabase_consent, valid_auth_header):
        """Should return 422 when intent is missing"""
        response = client.post(
            "/api/ai/clarify",
            json={"draft_text": "I feel hurt", "recipient": "friend"},
            headers=valid_auth_header,
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestHealthCheck:
    """Tests for health check endpoint"""

    def test_health_check(self, client):
        """Should return healthy status"""
        response = client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "the-unsaid-api"

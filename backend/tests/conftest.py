# ===========================================
# THE UNSAID - Backend Test Configuration
# ===========================================
# Pytest fixtures for API testing
# Provides mocks for auth, consent, and OpenRouter

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Set test environment variables BEFORE importing app
os.environ["OPENROUTER_API_KEY"] = "test-api-key"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["PRIVATE_SUPABASE_SECRET_KEY"] = "test-secret-key"
os.environ["FRONTEND_URL"] = "http://localhost:5173"
os.environ["AI_RATE_LIMIT_PER_HOUR"] = "1000"  # High limit for tests

from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def mock_supabase_auth():
    """Mock Supabase auth.get_user to return a valid user"""
    mock_user = MagicMock()
    mock_user.id = "test-user-id-12345"
    mock_response = MagicMock()
    mock_response.user = mock_user

    with patch("app.middleware.auth.supabase") as mock_supabase:
        mock_supabase.auth.get_user.return_value = mock_response
        yield mock_supabase


@pytest.fixture
def mock_supabase_consent():
    """Mock Supabase preferences table to return ai_enabled=True"""
    mock_data = {"ai_enabled": True}
    mock_response = MagicMock()
    mock_response.data = mock_data

    with patch("app.middleware.auth.supabase") as mock_supabase:
        # Set up auth mock
        mock_user = MagicMock()
        mock_user.id = "test-user-id-12345"
        mock_auth_response = MagicMock()
        mock_auth_response.user = mock_user
        mock_supabase.auth.get_user.return_value = mock_auth_response

        # Set up table mock
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq = MagicMock()
        mock_single = MagicMock()

        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.single.return_value = mock_single
        mock_single.execute.return_value = mock_response

        yield mock_supabase


@pytest.fixture
def mock_openrouter():
    """Mock OpenRouter API responses"""
    from app.models.ai import AIOption, AIResponse

    mock_response = AIResponse(
        options=[
            AIOption(text="Test suggestion 1", why="This is clearer"),
            AIOption(text="Test suggestion 2", why="This is more empathetic"),
        ],
        original_valid=True,
    )

    with patch("app.services.openrouter.OpenRouterService") as mock_service_class:
        mock_instance = AsyncMock()
        mock_instance.clarify.return_value = mock_response
        mock_instance.alternatives.return_value = mock_response
        mock_instance.tone.return_value = mock_response
        mock_instance.expand.return_value = mock_response
        mock_instance.opening.return_value = mock_response
        mock_service_class.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def valid_auth_header():
    """Valid authorization header for testing"""
    return {"Authorization": "Bearer test-jwt-token"}


@pytest.fixture
def sample_clarify_request():
    """Sample request body for clarify endpoint"""
    return {
        "draft_text": "I feel really hurt by what you said.",
        "recipient": "friend",
        "intent": "express feelings",
    }


@pytest.fixture
def sample_tone_request():
    """Sample request body for tone endpoint"""
    return {
        "draft_text": "You always do this and it's really annoying.",
        "recipient": "partner",
        "intent": "address behavior",
    }


@pytest.fixture
def sample_alternatives_request():
    """Sample request body for alternatives endpoint"""
    return {
        "draft_text": "I need you to understand how I'm feeling right now.",
        "recipient": "parent",
        "intent": "open up emotionally",
    }


@pytest.fixture
def sample_expand_request():
    """Sample request body for expand endpoint"""
    return {
        "draft_text": "I'm upset.",
        "recipient": "therapist",
        "intent": "share feelings",
    }


@pytest.fixture
def sample_opening_request():
    """Sample request body for opening endpoint"""
    return {
        "draft_text": "",
        "recipient": "boss",
        "intent": "deliver news",
    }

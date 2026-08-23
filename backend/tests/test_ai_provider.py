import pytest
import json
from unittest.mock import patch, MagicMock
from google.genai.errors import APIError
from pydantic import ValidationError

from app.services.ai.base import AIProviderException
from app.services.ai.gemini import GeminiProvider, is_transient_error
from app.services.ai.factory import get_ai_provider
from app.models.ai import StudyMaterialResponse, QuizResponse
from app.config import settings

@pytest.fixture
def mock_settings(monkeypatch):
    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "fake-key")
    monkeypatch.setattr(settings, "ai_model", "gemini-1.5-flash")
    return settings

def test_provider_factory(mock_settings):
    provider = get_ai_provider()
    assert isinstance(provider, GeminiProvider)

def test_unsupported_provider(monkeypatch):
    monkeypatch.setattr(settings, "ai_provider", "unsupported")
    with pytest.raises(AIProviderException) as exc:
        get_ai_provider()
    assert "Unsupported AI provider configured" in str(exc.value)

def test_openai_unsupported(monkeypatch):
    monkeypatch.setattr(settings, "ai_provider", "openai")
    with pytest.raises(AIProviderException) as exc:
        get_ai_provider()
    assert "OpenAI provider is not yet implemented" in str(exc.value)

def test_gemini_no_api_key(monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", "")
    with pytest.raises(AIProviderException) as exc:
        GeminiProvider()
    assert "Gemini API key is not configured" in str(exc.value)

@pytest.mark.asyncio
@patch('app.services.ai.gemini.genai.Client')
async def test_gemini_study_success(mock_client, mock_settings):
    mock_response = MagicMock()
    # Mocking google-genai response object
    mock_response.text = json.dumps({
        "summary": "Mock summary",
        "key_points": ["P1", "P2"],
        "important_concepts": ["C1"],
        "definitions": {"C1": "D1"},
        "revision_notes": "Rev notes"
    })
    
    mock_client_instance = MagicMock()
    mock_client_instance.models.generate_content.return_value = mock_response
    mock_client.return_value = mock_client_instance
    
    provider = GeminiProvider()
    
    chunks = [{"text": "Chunk 1"}, {"text": "Chunk 2"}]
    result = await provider.generate_study_material(chunks, {})
    
    assert isinstance(result, StudyMaterialResponse)
    assert result.summary == "Mock summary"

@pytest.mark.asyncio
@patch('app.services.ai.gemini.genai.Client')
async def test_gemini_malformed_json_failure(mock_client, mock_settings):
    mock_response = MagicMock()
    # Mock invalid structured response
    mock_response.text = json.dumps({"invalid_schema": True})
    
    mock_client_instance = MagicMock()
    mock_client_instance.models.generate_content.return_value = mock_response
    mock_client.return_value = mock_client_instance
    
    provider = GeminiProvider()
    
    chunks = [{"text": "Chunk 1"}]
    with pytest.raises(AIProviderException) as exc:
        await provider.generate_study_material(chunks, {})
    
    assert "Failed to validate structured output from Gemini" in str(exc.value)

@pytest.mark.asyncio
@patch('app.services.ai.gemini.genai.Client')
async def test_gemini_transient_retry(mock_client, mock_settings):
    # Setup mock to fail with 503 twice, then succeed
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "summary": "Success after retries",
        "key_points": [],
        "important_concepts": [],
        "definitions": {},
        "revision_notes": ""
    })
    
    err_503 = APIError(503, {"status": "Service Unavailable", "message": "Service Unavailable"})
    
    mock_client_instance = MagicMock()
    mock_client_instance.models.generate_content.side_effect = [err_503, err_503, mock_response]
    mock_client.return_value = mock_client_instance
    
    provider = GeminiProvider()
    
    # We patch tenacity wait to run immediately for tests
    import app.services.ai.gemini
    
    # Change the multiplier to 0 for instant retries in tests
    original_retry = provider._call_gemini_api.retry
    
    try:
        chunks = [{"text": "Chunk 1"}]
        result = await provider.generate_study_material(chunks, {})
        assert result.summary == "Success after retries"
        assert mock_client_instance.models.generate_content.call_count == 3
    finally:
        pass

@pytest.mark.asyncio
@patch('app.services.ai.gemini.genai.Client')
async def test_gemini_permanent_error_no_retry(mock_client, mock_settings):
    # Setup mock to fail with 401
    err_401 = APIError(401, {"status": "Unauthorized", "message": "Unauthorized"})
    
    mock_client_instance = MagicMock()
    mock_client_instance.models.generate_content.side_effect = [err_401]
    mock_client.return_value = mock_client_instance
    
    provider = GeminiProvider()
    
    chunks = [{"text": "Chunk 1"}]
    with pytest.raises(AIProviderException) as exc:
        await provider.generate_study_material(chunks, {})
        
    assert "Gemini API Error" in str(exc.value)
    assert mock_client_instance.models.generate_content.call_count == 1  # Should not retry

import asyncio

@pytest.mark.asyncio
@patch('app.services.ai.gemini.genai.Client')
async def test_gemini_timeout(mock_client, mock_settings):
    provider = GeminiProvider()
    
    async def mock_call(*args, **kwargs):
        await asyncio.sleep(0.5)
        return MagicMock()
        
    with patch('asyncio.to_thread', new=mock_call):
        chunks = [{"text": "Chunk 1"}]
        with pytest.raises(AIProviderException) as exc:
            # Short timeout
            await provider.generate_study_material(chunks, {"timeout": 0.1})
        assert "timed out" in str(exc.value)

@pytest.mark.asyncio
@patch('app.services.ai.gemini.genai.Client')
async def test_gemini_large_document_orchestration(mock_client, mock_settings):
    # Mock for intermediate responses and final response
    mock_intermediate = MagicMock()
    mock_intermediate.text = json.dumps({
        "summary": "Intermediate sum",
        "key_points": ["IP1"],
        "important_concepts": ["IC1"]
    })
    
    mock_final = MagicMock()
    mock_final.text = json.dumps({
        "summary": "Final sum",
        "key_points": ["FP1"],
        "important_concepts": ["FC1"],
        "definitions": {},
        "revision_notes": ""
    })
    
    mock_client_instance = MagicMock()
    # If 7 chunks, and batch size is 5: 
    # Batch 1 (5 chunks) -> intermediate
    # Batch 2 (2 chunks) -> intermediate
    # Final Synthesis -> final
    mock_client_instance.models.generate_content.side_effect = [
        mock_intermediate, mock_intermediate, mock_final
    ]
    mock_client.return_value = mock_client_instance
    
    provider = GeminiProvider()
    
    chunks = [{"text": f"Chunk {i}"} for i in range(7)]
    result = await provider.generate_study_material(chunks, {})
    
    assert result.summary == "Final sum"
    assert mock_client_instance.models.generate_content.call_count == 3


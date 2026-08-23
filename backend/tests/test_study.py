import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock, AsyncMock
import copy
import json
from pydantic import BaseModel

from app.main import app

# Mock DB State
mock_study_db = {}
mock_documents_db = {
    "doc1": {
        "user_id": "user1",
        "status": "Processed",
        "extracted_text": "This is test document text for AI generation.",
        "file_hash": "hash123"
    },
    "doc_pending": {
        "user_id": "user1",
        "status": "Pending",
        "file_hash": "hash_pending"
    },
    "doc2": {
        "user_id": "user2",
        "status": "Processed",
        "extracted_text": "Another document.",
        "file_hash": "hash456"
    }
}
mock_users_db = {
    "user1": {"_id": "user1", "email": "user1@example.com"},
    "user2": {"_id": "user2", "email": "user2@example.com"}
}

def get_mock_db():
    class MockCollection:
        def __init__(self, data_store):
            self.data = data_store
            
        async def find_one(self, query):
            for k, v in self.data.items():
                match = True
                for qk, qv in query.items():
                    if qk == "_id":
                        if str(k) != str(qv): match = False
                    elif qk == "status" and isinstance(qv, dict) and "$in" in qv:
                        if v.get(qk) not in qv["$in"]: match = False
                    elif v.get(qk) != qv:
                        match = False
                if match:
                    res = copy.deepcopy(v)
                    res["_id"] = k
                    return res
            return None
            
        async def insert_one(self, doc):
            new_id = doc.get("_id", "sess_" + str(len(self.data)))
            self.data[new_id] = copy.deepcopy(doc)
            class Result:
                inserted_id = new_id
            return Result()
            
        async def count_documents(self, query):
            count = 0
            for k, v in self.data.items():
                match = True
                for qk, qv in query.items():
                    if qk == "status" and isinstance(qv, dict) and "$in" in qv:
                        if v.get(qk) not in qv["$in"]: match = False
                    elif v.get(qk) != qv: match = False
                if match: count += 1
            return count

        async def find_one_and_update(self, query, update, upsert=False, return_document=None):
            doc = await self.find_one(query)
            if doc:
                # Update existing
                set_ops = update.get("$set", {})
                for k, v in set_ops.items():
                    self.data[doc["_id"]][k] = v
                return self.data[doc["_id"]]
            elif upsert:
                # Insert
                new_doc = update.get("$setOnInsert", {})
                new_id = new_doc.get("_id", "sess_" + str(len(self.data)))
                self.data[new_id] = copy.deepcopy(new_doc)
                return self.data[new_id]
            return None
            
        async def update_one(self, query, update):
            doc = await self.find_one(query)
            if doc:
                set_ops = update.get("$set", {})
                for k, v in set_ops.items():
                    self.data[doc["_id"]][k] = v
                class Result:
                    modified_count = 1
                return Result()
            class Result:
                modified_count = 0
            return Result()

    class MockDB:
        def __init__(self):
            self.documents = MockCollection(mock_documents_db)
            self.users = MockCollection(mock_users_db)
            self.study_sessions = MockCollection(mock_study_db)
            
    return MockDB()

@pytest.fixture(autouse=True)
def setup_teardown():
    mock_study_db.clear()
    with patch("app.routes.study.get_database", side_effect=get_mock_db):
        with patch("app.services.ai.worker.get_database", side_effect=get_mock_db):
            yield

from app.routes.auth import get_current_user
async def override_get_current_user():
    return mock_users_db["user1"]
app.dependency_overrides[get_current_user] = override_get_current_user

# --- TESTS ---

@pytest.mark.asyncio
async def test_create_study_session_success():
    payload = {"document_id": "doc1", "detail_level": "standard"}
    
    with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/ai/study", json=payload)
            
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Queued"
    assert "session_id" in data
    assert not data["cached"]

@pytest.mark.asyncio
async def test_create_study_session_not_processed():
    payload = {"document_id": "doc_pending"}
    
    with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/ai/study", json=payload)
            
    assert response.status_code == 400
    assert "Processed" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_study_session_unauthorized():
    payload = {"document_id": "doc2"} # Belongs to user2
    
    with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/ai/study", json=payload)
            
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_study_session_duplicate_active():
    # Insert an active session
    mock_study_db["active1"] = {
        "_id": "active1",
        "user_id": "user1",
        "document_id": "doc1",
        "status": "Generating",
        "cache_key": "dummy_cache_key"
    }
    
    # Mock generate_cache_key to return dummy_cache_key
    with patch("app.routes.study.generate_cache_key", return_value="dummy_cache_key"):
        with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/ai/study", json={"document_id": "doc1"})
                
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Generating"
    assert data["session_id"] == "active1"
    
@pytest.mark.asyncio
async def test_create_study_session_completed_cache():
    # Insert a completed session
    mock_study_db["completed1"] = {
        "_id": "completed1",
        "user_id": "user1",
        "document_id": "doc1",
        "status": "Completed",
        "cache_key": "dummy_cache_key"
    }
    
    with patch("app.routes.study.generate_cache_key", return_value="dummy_cache_key"):
        with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/ai/study", json={"document_id": "doc1"})
                
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Completed"
    assert data["session_id"] == "completed1"
    assert data["cached"] is True

@pytest.mark.asyncio
async def test_rate_limit_max_active():
    # Insert 2 active sessions
    mock_study_db["active1"] = {"status": "Generating", "user_id": "user1", "cache_key": "c1"}
    mock_study_db["active2"] = {"status": "Queued", "user_id": "user1", "cache_key": "c2"}
    
    with patch("app.routes.study.generate_cache_key", return_value="c3"):
        with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/ai/study", json={"document_id": "doc1"})
                
    assert response.status_code == 429
    assert "Maximum active AI generations reached" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_study_session_success():
    mock_study_db["sess1"] = {
        "_id": "sess1",
        "user_id": "user1",
        "status": "Completed",
        "result": {"summary": "Great summary"}
    }
    
    with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/ai/study/sess1")
            
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Completed"
    assert data["result"]["summary"] == "Great summary"

@pytest.mark.asyncio
async def test_get_study_session_unauthorized():
    mock_study_db["sess1"] = {
        "_id": "sess1",
        "user_id": "user2",
        "status": "Completed"
    }
    
    with patch("app.routes.study.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/ai/study/sess1")
            
    assert response.status_code == 403

# --- WORKER TESTS ---
from app.services.ai.worker import process_study_session_task

@pytest.mark.asyncio
async def test_worker_success():
    # Setup Queued session
    mock_study_db["sess_worker_1"] = {
        "_id": "sess_worker_1",
        "user_id": "user1",
        "document_id": "doc1",
        "status": "Queued"
    }
    
    # Mock Provider
    class MockStudyMaterial(BaseModel):
        summary: str
        key_points: list
        important_concepts: list
        definitions: dict
        revision_notes: str
        
    mock_provider = copy.deepcopy(get_mock_db()) # just an empty object to attach to
    mock_provider.generate_study_material = AsyncMock(return_value=MockStudyMaterial(
        summary="Success summary", key_points=[], important_concepts=[], definitions={}, revision_notes=""
    ))
    
    with patch("app.services.ai.worker.get_database", side_effect=get_mock_db):
        with patch("app.services.ai.worker.get_ai_provider", return_value=mock_provider):
            await process_study_session_task("sess_worker_1")
            
    # Verify DB state
    updated_session = mock_study_db["sess_worker_1"]
    assert updated_session["status"] == "Completed"
    assert updated_session["result"]["summary"] == "Success summary"

@pytest.mark.asyncio
async def test_worker_failure():
    mock_study_db["sess_worker_2"] = {
        "_id": "sess_worker_2",
        "user_id": "user1",
        "document_id": "doc1",
        "status": "Queued"
    }
    
    from app.services.ai.base import AIProviderException
    
    # Mock Provider to raise error
    mock_provider = copy.deepcopy(get_mock_db())
    mock_provider.generate_study_material = AsyncMock(side_effect=AIProviderException("AI generation timed out."))
    
    with patch("app.services.ai.worker.get_database", side_effect=get_mock_db):
        with patch("app.services.ai.worker.get_ai_provider", return_value=mock_provider):
            await process_study_session_task("sess_worker_2")
            
    # Verify DB state
    updated_session = mock_study_db["sess_worker_2"]
    assert updated_session["status"] == "Failed"
    assert updated_session["error_code"] == "PROVIDER_ERROR"
    assert "timed out" in updated_session["error_message"]

import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import copy
import uuid

from app.main import app
from app.security import hash_otp, get_password_hash, hash_refresh_token, create_access_token, create_refresh_token
from app.config import settings
from fastapi import APIRouter, Depends
from app.routes.auth import get_current_user

# Mock DB State
mock_users_db = {}

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
                    elif "." in qk:
                        parts = qk.split(".")
                        if v.get(parts[0], {}).get(parts[1]) != qv:
                            match = False
                    elif v.get(qk) != qv:
                        match = False
                if match:
                    res = copy.deepcopy(v)
                    res["_id"] = k
                    return res
            return None
            
        async def insert_one(self, doc):
            new_id = "test_id_" + str(len(self.data))
            self.data[new_id] = copy.deepcopy(doc)
            class Result:
                inserted_id = new_id
            return Result()
            
        async def update_one(self, query, update_op):
            doc = await self.find_one(query)
            if not doc:
                return
            doc_id = doc["_id"]
            
            if "$set" in update_op:
                for k, v in update_op["$set"].items():
                    if "." in k:
                        parts = k.split(".")
                        if parts[0] not in self.data[doc_id]:
                            self.data[doc_id][parts[0]] = {}
                        self.data[doc_id][parts[0]][parts[1]] = v
                    else:
                        self.data[doc_id][k] = v
            if "$inc" in update_op:
                for k, v in update_op["$inc"].items():
                    parts = k.split(".")
                    if parts[0] in self.data[doc_id] and parts[1] in self.data[doc_id][parts[0]]:
                        self.data[doc_id][parts[0]][parts[1]] += v
            if "$unset" in update_op:
                for k in update_op["$unset"]:
                    if k in self.data[doc_id]:
                        del self.data[doc_id][k]
            if "$push" in update_op:
                for k, v in update_op["$push"].items():
                    if k not in self.data[doc_id]:
                        self.data[doc_id][k] = []
                    self.data[doc_id][k].append(v)
            if "$pull" in update_op:
                for k, v in update_op["$pull"].items():
                    if k in self.data[doc_id]:
                        new_list = []
                        for item in self.data[doc_id][k]:
                            match = True
                            for p_k, p_v in v.items():
                                if item.get(p_k) == p_v:
                                    match = False
                            if match:
                                new_list.append(item)
                        self.data[doc_id][k] = new_list
                        
    class MockDB:
        def __init__(self):
            self.users = MockCollection(mock_users_db)
            
    return MockDB()

@pytest.fixture(autouse=True)
def setup_teardown():
    mock_users_db.clear()
    with patch("app.routes.auth.get_database", side_effect=get_mock_db):
        yield

@pytest.fixture
def mock_email():
    with patch("app.routes.auth.send_verification_email") as mock:
        yield mock

# Add a dummy protected route for testing
dummy_router = APIRouter()
@dummy_router.get("/api/dummy-protected")
async def dummy_protected(user=Depends(get_current_user)):
    return {"message": "Success", "user_id": str(user["_id"])}

app.include_router(dummy_router)

# --- SIGNUP & EMAIL VERIFICATION TESTS (Existing) ---
@pytest.mark.asyncio
async def test_signup_success(mock_email):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "Password123"
        })
    assert response.status_code == 202
    assert mock_email.called
    
@pytest.mark.asyncio
async def test_signup_duplicate_unverified(mock_email):
    await test_signup_success(mock_email)
    mock_email.reset_mock()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "Password123"
        })
    assert response.status_code == 202
    assert len(mock_users_db) == 1

@pytest.mark.asyncio
async def test_verify_email_success():
    otp = "123456"
    now = datetime.now(timezone.utc)
    mock_users_db["60f1b9b9b9b9b9b9b9b9b9ba"] = {
        "email": "test@example.com",
        "email_verified": False,
        "verification": {
            "hashed_otp": hash_otp(otp),
            "expires_at": now + timedelta(minutes=10),
            "attempts": 0,
            "last_sent_at": now
        }
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/verify-email", json={
            "email": "test@example.com",
            "otp": otp
        })
    assert response.status_code == 200

# --- LOGIN & REFRESH TESTS (New & Expanded) ---

@pytest.mark.asyncio
async def test_login_success():
    pwd = "Password123"
    mock_users_db["60f1b9b9b9b9b9b9b9b9b9b9"] = {
        "email": "test_verified@example.com",
        "email_verified": True,
        "password_hash": get_password_hash(pwd),
        "sessions": []
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/login", json={
            "email": "test_verified@example.com",
            "password": pwd
        })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "password_hash" not in data
    
    # Check that refresh cookie was set
    cookies = response.cookies
    assert "refresh_token" in cookies
    
    # Check DB session created
    user = mock_users_db["60f1b9b9b9b9b9b9b9b9b9b9"]
    assert len(user["sessions"]) == 1
    session = user["sessions"][0]
    assert "session_id" in session

@pytest.mark.asyncio
async def test_login_wrong_password():
    pwd = "Password123"
    mock_users_db["60f1b9b9b9b9b9b9b9b9b9b9"] = {
        "email": "test_verified@example.com",
        "email_verified": True,
        "password_hash": get_password_hash(pwd)
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/login", json={
            "email": "test_verified@example.com",
            "password": "WrongPassword!"
        })
    assert response.status_code == 401
    assert "access_token" not in response.json()

@pytest.mark.asyncio
async def test_login_nonexistent_account():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "Password123"
        })
    assert response.status_code == 401
    assert "access_token" not in response.json()

@pytest.mark.asyncio
async def test_login_unverified_blocked():
    pwd = "Password123"
    mock_users_db["60f1b9b9b9b9b9b9b9b9b9ba"] = {
        "email": "test@example.com",
        "email_verified": False,
        "password_hash": get_password_hash(pwd)
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": pwd
        })
    assert response.status_code == 403
    assert response.json()["detail"]["error_type"] == "email_unverified"
    assert "refresh_token" not in response.cookies

@pytest.mark.asyncio
async def test_refresh_token_rotation():
    user_id = "60f1b9b9b9b9b9b9b9b9b9b9"
    session_id_a = str(uuid.uuid4())
    refresh_token_a, exp_a = create_refresh_token(user_id, session_id_a)
    
    mock_users_db[user_id] = {
        "email": "test@example.com",
        "email_verified": True,
        "sessions": [{
            "session_id": session_id_a,
            "refresh_token_hash": hash_refresh_token(refresh_token_a),
            "created_at": datetime.now(timezone.utc),
            "expires_at": exp_a,
            "revoked": False
        }]
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Request with Token A
        response = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token_a})
        
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
    refresh_token_b = response.cookies.get("refresh_token")
    assert refresh_token_b is not None
    assert refresh_token_b != refresh_token_a
    
    # Verify DB state updated: Old session removed, new session added
    user = mock_users_db[user_id]
    assert len(user["sessions"]) == 1
    session_b_data = user["sessions"][0]
    assert session_b_data["session_id"] != session_id_a
    
    # Verify Token A can NO LONGER be used
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        failed_response = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token_a})
    assert failed_response.status_code == 401
    
    # Verify Token B works
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        success_response = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token_b})
    assert success_response.status_code == 200

@pytest.mark.asyncio
async def test_refresh_token_expired_rejected():
    # Simulate expired token by injecting old date
    with patch('app.security.datetime') as mock_datetime:
        mock_datetime.now.return_value = datetime.now(timezone.utc) - timedelta(days=10)
        refresh_token_a, _ = create_refresh_token("id", "sid")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token_a})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_logout_clears_session():
    user_id = "60f1b9b9b9b9b9b9b9b9b9b9"
    session_id = str(uuid.uuid4())
    refresh_token, exp = create_refresh_token(user_id, session_id)
    
    mock_users_db[user_id] = {
        "email": "test@example.com",
        "sessions": [{
            "session_id": session_id,
            "refresh_token_hash": hash_refresh_token(refresh_token),
            "expires_at": exp,
            "revoked": False
        }]
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/logout", cookies={"refresh_token": refresh_token})
        
    assert response.status_code == 200
    
    # Session should be removed
    assert len(mock_users_db[user_id]["sessions"]) == 0
    
    # Refresh should now fail
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        refresh_resp = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token})
    assert refresh_resp.status_code == 401

@pytest.mark.asyncio
async def test_protected_route_access():
    user_id = "60f1b9b9b9b9b9b9b9b9b9bb"
    mock_users_db[user_id] = {"_id": user_id, "email": "test@example.com"}
    access_token = create_access_token(user_id)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Valid token
        res1 = await ac.get("/api/dummy-protected", headers={"Authorization": f"Bearer {access_token}"})
        assert res1.status_code == 200
        assert res1.json()["user_id"] == user_id
        
        # No token
        res2 = await ac.get("/api/dummy-protected")
        assert res2.status_code == 401
        
        # Invalid token
        res3 = await ac.get("/api/dummy-protected", headers={"Authorization": "Bearer badtoken"})
        assert res3.status_code == 401

# --- FORGOT PASSWORD & RESET TESTS ---
@pytest.fixture
def mock_reset_email():
    with patch("app.routes.auth.send_password_reset_email") as mock:
        yield mock

@pytest.mark.asyncio
async def test_forgot_password_success(mock_reset_email):
    mock_users_db["60f1b9b9b9b9b9b9b9b9b9bf"] = {
        "email": "reset@example.com",
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/forgot-password", json={
            "email": "reset@example.com"
        })
    assert response.status_code == 202
    assert response.json()["detail"] == "If an account exists for this email, a password reset code has been sent."
    assert mock_reset_email.called
    user = mock_users_db["60f1b9b9b9b9b9b9b9b9b9bf"]
    assert "password_reset" in user
    assert "hashed_otp" in user["password_reset"]

@pytest.mark.asyncio
async def test_forgot_password_nonexistent_account(mock_reset_email):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })
    assert response.status_code == 202
    assert response.json()["detail"] == "If an account exists for this email, a password reset code has been sent."
    assert not mock_reset_email.called

@pytest.mark.asyncio
async def test_resend_password_reset_cooldown(mock_reset_email):
    now = datetime.now(timezone.utc)
    mock_users_db["60f1b9b9b9b9b9b9b9b9b9cf"] = {
        "email": "reset2@example.com",
        "password_reset": {
            "hashed_otp": "somehash",
            "expires_at": now + timedelta(minutes=10),
            "attempts": 0,
            "last_sent_at": now
        }
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/resend-password-reset", json={
            "email": "reset2@example.com"
        })
    assert response.status_code == 429
    assert "Please wait" in response.json()["detail"]
    assert not mock_reset_email.called

@pytest.mark.asyncio
async def test_reset_password_success_and_session_invalidation():
    otp = "123456"
    pwd = "OldPassword123"
    now = datetime.now(timezone.utc)
    user_id = "60f1b9b9b9b9b9b9b9b9b9df"
    
    mock_users_db[user_id] = {
        "email": "reset3@example.com",
        "password_hash": get_password_hash(pwd),
        "password_reset": {
            "hashed_otp": hash_otp(otp),
            "expires_at": now + timedelta(minutes=10),
            "attempts": 0,
            "last_sent_at": now - timedelta(minutes=2)
        },
        "sessions": [
            {"session_id": "sess1", "refresh_token_hash": "hash1", "expires_at": now + timedelta(days=1), "revoked": False},
            {"session_id": "sess2", "refresh_token_hash": "hash2", "expires_at": now + timedelta(days=1), "revoked": False}
        ]
    }
    
    new_pwd = "NewPassword123"
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/reset-password", json={
            "email": "reset3@example.com",
            "otp": otp,
            "new_password": new_pwd
        })
        
    assert response.status_code == 200
    user = mock_users_db[user_id]
    assert user["password_reset"] is None
    assert len(user["sessions"]) == 0
    
    from app.security import verify_password
    assert verify_password(new_pwd, user["password_hash"])
    
@pytest.mark.asyncio
async def test_reset_password_wrong_otp_increments_attempts():
    otp = "123456"
    wrong_otp = "000000"
    now = datetime.now(timezone.utc)
    user_id = "60f1b9b9b9b9b9b9b9b9b9ef"
    
    mock_users_db[user_id] = {
        "email": "reset4@example.com",
        "password_reset": {
            "hashed_otp": hash_otp(otp),
            "expires_at": now + timedelta(minutes=10),
            "attempts": 4, # Next one will be 5, hitting limit
            "last_sent_at": now - timedelta(minutes=2)
        }
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/reset-password", json={
            "email": "reset4@example.com",
            "otp": wrong_otp,
            "new_password": "NewPassword123"
        })
        
    assert response.status_code == 429
    assert "Maximum verification attempts exceeded" in response.json()["detail"]
    user = mock_users_db[user_id]
    assert user["password_reset"] is None

@pytest.mark.asyncio
async def test_reset_password_expired_otp():
    otp = "123456"
    now = datetime.now(timezone.utc)
    user_id = "60f1b9b9b9b9b9b9b9b9b9ff"
    
    mock_users_db[user_id] = {
        "email": "reset5@example.com",
        "password_reset": {
            "hashed_otp": hash_otp(otp),
            "expires_at": now - timedelta(minutes=1),
            "attempts": 0,
            "last_sent_at": now - timedelta(minutes=11)
        }
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/reset-password", json={
            "email": "reset5@example.com",
            "otp": otp,
            "new_password": "NewPassword123"
        })
        
    assert response.status_code == 400
    assert "expired" in response.json()["detail"]

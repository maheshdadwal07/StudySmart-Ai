from fastapi import APIRouter, HTTPException, status, Response, Request, Depends
from datetime import datetime, timezone
import uuid
from bson import ObjectId

from app.models.user import UserCreate, UserLogin, UserResponse, Token, UserInDB, SessionModel
from app.database import get_database
from app.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    verify_refresh_token,
    verify_access_token,
    oauth2_scheme
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    user_id = verify_access_token(token)
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def set_refresh_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True if settings.environment == "production" else False,
        samesite="none" if settings.environment == "production" else "lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    )

def clear_refresh_cookie(response: Response):
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True if settings.environment == "production" else False,
        samesite="none" if settings.environment == "production" else "lax",
    )

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_database()
    email_normalized = user_data.email.lower().strip()
    
    existing_user = await db.users.find_one({"email": email_normalized})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
    now = datetime.now(timezone.utc)
    user_dict = {
        "name": user_data.name,
        "email": email_normalized,
        "password_hash": get_password_hash(user_data.password),
        "preferences": {"theme": "light", "email_notifications": True},
        "sessions": [],
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    return user_dict

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, response: Response):
    db = get_database()
    email_normalized = user_data.email.lower().strip()
    
    user = await db.users.find_one({"email": email_normalized})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        
    user_id_str = str(user["_id"])
    
    # Generate tokens
    access_token = create_access_token(user_id_str)
    session_id = str(uuid.uuid4())
    refresh_token, refresh_exp = create_refresh_token(user_id_str, session_id)
    
    # Store session
    session = SessionModel(
        session_id=session_id,
        refresh_token_hash=hash_refresh_token(refresh_token),
        created_at=datetime.now(timezone.utc),
        expires_at=refresh_exp,
        revoked=False
    )
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$push": {"sessions": session.model_dump()}}
    )
    
    set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
        
    user_id_str, session_id = verify_refresh_token(refresh_token)
    
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id_str)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    # Find active session
    current_session = None
    for s in user.get("sessions", []):
        if s["session_id"] == session_id:
            current_session = s
            break
            
    if not current_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")
        
    if current_session["revoked"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session has been revoked")
        
    if current_session["expires_at"].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
        
    token_hash = hash_refresh_token(refresh_token)
    if current_session["refresh_token_hash"] != token_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token mismatch")
        
    # Rotate tokens
    new_access_token = create_access_token(user_id_str)
    new_session_id = str(uuid.uuid4())
    new_refresh_token, new_refresh_exp = create_refresh_token(user_id_str, new_session_id)
    
    new_session = SessionModel(
        session_id=new_session_id,
        refresh_token_hash=hash_refresh_token(new_refresh_token),
        created_at=datetime.now(timezone.utc),
        expires_at=new_refresh_exp,
        revoked=False
    )
    
    # Remove old session
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$pull": {"sessions": {"session_id": session_id}}}
    )
    
    # Add new session
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$push": {"sessions": new_session.model_dump()}}
    )
    
    set_refresh_cookie(response, new_refresh_token)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    clear_refresh_cookie(response)
    
    if refresh_token:
        try:
            user_id_str, session_id = verify_refresh_token(refresh_token)
            db = get_database()
            # Revoke session by removing it or setting revoked=True. We'll set revoked=True or remove it.
            # Let's remove it for simplicity and space saving.
            await db.users.update_one(
                {"_id": ObjectId(user_id_str)},
                {"$pull": {"sessions": {"session_id": session_id}}}
            )
        except Exception:
            pass # Even if token is invalid, we clear the cookie

    return {"detail": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    # Convert _id object to string for Pydantic response
    current_user["_id"] = str(current_user["_id"])
    return current_user

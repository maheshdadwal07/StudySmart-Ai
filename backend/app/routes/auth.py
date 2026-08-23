from fastapi import APIRouter, HTTPException, status, Response, Request, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
import uuid
from bson import ObjectId
from pydantic import BaseModel, EmailStr

from app.models.user import UserCreate, UserLogin, UserResponse, Token, UserInDB, SessionModel, OTPModel
from app.database import get_database
from app.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    verify_refresh_token,
    verify_access_token,
    oauth2_scheme,
    generate_otp,
    hash_otp,
    verify_otp
)
from app.config import settings
from app.utils.email_service import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

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

@router.post("/register", status_code=status.HTTP_202_ACCEPTED)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    db = get_database()
    email_normalized = user_data.email.lower().strip()
    
    existing_user = await db.users.find_one({"email": email_normalized})
    
    now = datetime.now(timezone.utc)
    otp_code = generate_otp()
    otp_hash = hash_otp(otp_code)
    expires_at = now + timedelta(minutes=10)
    
    verification_state = {
        "hashed_otp": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "last_sent_at": now
    }
    
    if existing_user:
        if existing_user.get("email_verified", False):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
        # Update existing unverified user
        await db.users.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "verification": verification_state,
                    "password_hash": get_password_hash(user_data.password),
                    "name": user_data.name,
                    "updated_at": now
                }
            }
        )
    else:
        user_dict = {
            "name": user_data.name,
            "email": email_normalized,
            "password_hash": get_password_hash(user_data.password),
            "email_verified": False,
            "verification": verification_state,
            "preferences": {"theme": "light", "email_notifications": True},
            "sessions": [],
            "created_at": now,
            "updated_at": now
        }
        await db.users.insert_one(user_dict)
    
    background_tasks.add_task(send_verification_email, email_normalized, otp_code)
    return {"detail": "Verification required. Please check your email for the OTP."}

@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(verify_data: VerifyEmailRequest):
    db = get_database()
    email_normalized = verify_data.email.lower().strip()
    
    user = await db.users.find_one({"email": email_normalized})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.get("email_verified", False):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified")
        
    verification = user.get("verification")
    if not verification:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No verification pending")
        
    now = datetime.now(timezone.utc)
    if verification.get("attempts", 0) >= 5:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Maximum verification attempts exceeded. Please request a new code.")
        
    expires_at = verification["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")
        
    if not verify_otp(verify_data.otp, verification["hashed_otp"]):
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"verification.attempts": 1}}
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
        
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"email_verified": True, "updated_at": now},
            "$unset": {"verification": ""}
        }
    )
    
    return {"detail": "Email verified successfully"}

@router.post("/resend-verification", status_code=status.HTTP_202_ACCEPTED)
async def resend_verification(resend_data: ResendVerificationRequest, background_tasks: BackgroundTasks):
    db = get_database()
    email_normalized = resend_data.email.lower().strip()
    
    user = await db.users.find_one({"email": email_normalized})
    if not user or user.get("email_verified", False):
        return {"detail": "If this email is registered and unverified, a new OTP has been sent."}
        
    verification = user.get("verification", {})
    now = datetime.now(timezone.utc)
    
    if verification:
        last_sent = verification.get("last_sent_at")
        if last_sent:
            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            if now < last_sent + timedelta(seconds=60):
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Please wait before requesting a new code.")
                
    otp_code = generate_otp()
    otp_hash = hash_otp(otp_code)
    expires_at = now + timedelta(minutes=10)
    
    new_verification_state = {
        "hashed_otp": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "last_sent_at": now
    }
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verification": new_verification_state, "updated_at": now}}
    )
    
    background_tasks.add_task(send_verification_email, email_normalized, otp_code)
    return {"detail": "If this email is registered and unverified, a new OTP has been sent."}

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, response: Response):
    db = get_database()
    email_normalized = user_data.email.lower().strip()
    
    user = await db.users.find_one({"email": email_normalized})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail={"error_type": "email_unverified", "message": "Email must be verified before logging in."}
        )
        
    user_id_str = str(user["_id"])
    
    access_token = create_access_token(user_id_str)
    session_id = str(uuid.uuid4())
    refresh_token, refresh_exp = create_refresh_token(user_id_str, session_id)
    
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
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$pull": {"sessions": {"session_id": session_id}}}
    )
    
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
            await db.users.update_one(
                {"_id": ObjectId(user_id_str)},
                {"$pull": {"sessions": {"session_id": session_id}}}
            )
        except Exception:
            pass

    return {"detail": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user["_id"] = str(current_user["_id"])
    return current_user

@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    db = get_database()
    email_normalized = request.email.lower().strip()
    user = await db.users.find_one({"email": email_normalized})

    now = datetime.now(timezone.utc)
    otp_code = generate_otp()
    otp_hash = hash_otp(otp_code)
    expires_at = now + timedelta(minutes=10)

    password_reset_state = {
        "hashed_otp": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "last_sent_at": now
    }

    if user:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password_reset": password_reset_state, "updated_at": now}}
        )
        background_tasks.add_task(send_password_reset_email, email_normalized, otp_code)

    return {"detail": "If an account exists for this email, a password reset code has been sent."}

@router.post("/resend-password-reset", status_code=status.HTTP_202_ACCEPTED)
async def resend_password_reset(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    db = get_database()
    email_normalized = request.email.lower().strip()
    user = await db.users.find_one({"email": email_normalized})

    if not user:
        return {"detail": "If an account exists for this email, a password reset code has been sent."}

    password_reset = user.get("password_reset", {})
    now = datetime.now(timezone.utc)

    if password_reset:
        last_sent = password_reset.get("last_sent_at")
        if last_sent:
            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            if now < last_sent + timedelta(seconds=60):
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Please wait before requesting a new code.")

    otp_code = generate_otp()
    otp_hash = hash_otp(otp_code)
    expires_at = now + timedelta(minutes=10)

    new_password_reset_state = {
        "hashed_otp": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "last_sent_at": now
    }

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_reset": new_password_reset_state, "updated_at": now}}
    )
    background_tasks.add_task(send_password_reset_email, email_normalized, otp_code)

    return {"detail": "If an account exists for this email, a password reset code has been sent."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest):
    db = get_database()
    email_normalized = request.email.lower().strip()
    
    if len(request.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long")
    if len(request.new_password) > 128:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must not exceed 128 characters")

    user = await db.users.find_one({"email": email_normalized})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request")

    password_reset = user.get("password_reset")
    if not password_reset:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No password reset pending")

    now = datetime.now(timezone.utc)
    
    if password_reset.get("attempts", 0) >= 5:
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_reset": None}})
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Maximum verification attempts exceeded. Please request a new code.")

    expires_at = password_reset["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new one.")

    if not verify_otp(request.otp, password_reset["hashed_otp"]):
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"password_reset.attempts": 1}}
        )
        # Check if they just hit the limit
        if password_reset.get("attempts", 0) + 1 >= 5:
             await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_reset": None}})
             raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Maximum verification attempts exceeded. Please request a new code.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    # Success - atomic update
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": get_password_hash(request.new_password),
                "password_reset": None,
                "sessions": [],
                "updated_at": now
            }
        }
    )

    return {"detail": "Password has been reset successfully. Please log in with your new password."}

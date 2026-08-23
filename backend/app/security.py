import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from pwdlib import PasswordHash
import jwt
from jwt.exceptions import PyJWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings

# Initialize Argon2id via pwdlib
password_hash = PasswordHash.recommended()

ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)

def hash_refresh_token(token: str) -> str:
    """Creates a simple SHA-256 hash of the refresh token to store in the DB."""
    return hashlib.sha256(token.encode()).hexdigest()

def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": str(subject), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.get_jwt_access_secret, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str, session_id: str) -> Tuple[str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode = {"sub": str(subject), "jti": session_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.get_jwt_refresh_secret, algorithm=ALGORITHM)
    return encoded_jwt, expire

def verify_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.get_jwt_access_secret, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return user_id
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

def verify_refresh_token(token: str) -> Tuple[str, str]:
    try:
        payload = jwt.decode(token, settings.get_jwt_refresh_secret, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        session_id: str = payload.get("jti")
        if user_id is None or session_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        return user_id, session_id
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

import secrets
def generate_otp() -> str:
    """Generates a secure 6-digit OTP."""
    return "".join(str(secrets.randbelow(10)) for _ in range(6))

def hash_otp(otp: str) -> str:
    """Hashes the OTP for storage using SHA-256."""
    return hashlib.sha256(otp.encode()).hexdigest()

def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    """Verifies a plaintext OTP against its hash."""
    return hash_otp(plain_otp) == hashed_otp

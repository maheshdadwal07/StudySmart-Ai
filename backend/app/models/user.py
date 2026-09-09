from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserProfile(BaseModel):
    phone: str = ""
    location: str = ""
    university: str = ""
    field: str = ""
    level: str = ""
    goal: str = ""
    bio: str = ""

class NotificationPreferences(BaseModel):
    emailDigest: bool = True
    studyReminders: bool = True
    weeklyReport: bool = False
    newFeatures: bool = True
    questionResults: bool = True

class PrivacyPreferences(BaseModel):
    publicProfile: bool = False
    activityFeed: bool = False
    analytics: bool = True

class UserPreferences(BaseModel):
    theme: str = "light"
    fontSize: str = "Medium"
    email_notifications: Optional[bool] = True
    notifications: NotificationPreferences = Field(default_factory=NotificationPreferences)
    privacy: PrivacyPreferences = Field(default_factory=PrivacyPreferences)

class SessionModel(BaseModel):
    session_id: str
    refresh_token_hash: str
    created_at: datetime
    expires_at: datetime
    revoked: bool = False

class OTPModel(BaseModel):
    hashed_otp: str
    expires_at: datetime
    attempts: int = 0
    last_sent_at: datetime

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    email_verified: bool = False
    profile: UserProfile = Field(default_factory=UserProfile)
    preferences: UserPreferences
    created_at: datetime
    updated_at: datetime

class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    password_hash: str
    email_verified: bool = False
    verification: Optional[OTPModel] = None
    password_reset: Optional[OTPModel] = None
    profile: UserProfile = Field(default_factory=UserProfile)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    sessions: List[SessionModel] = []
    created_at: datetime
    updated_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timezone
from app.database import get_database
from app.routes.auth import get_current_user
from app.models.user import UserProfile, UserPreferences
from app.security import verify_password, get_password_hash
from app.utils.stats import get_user_statistics

router = APIRouter(prefix="/api/account", tags=["account"])

class ProfileUpdateRequest(BaseModel):
    name: str
    profile: UserProfile

class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/stats")
async def get_account_stats(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    user_id_str = str(user_id)
    
    stats = await get_user_statistics(db, user_id, user_id_str)
    return stats

@router.patch("/profile")
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    if not request.name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")
        
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "name": request.name.strip(),
                "profile": request.profile.model_dump(),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"detail": "Profile updated successfully"}

@router.patch("/settings")
async def update_settings(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "preferences": preferences.model_dump(),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"detail": "Settings updated successfully"}

@router.patch("/password")
async def update_password(
    request: PasswordUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    if len(request.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters long")
        
    if not verify_password(request.current_password, current_user.get("password_hash")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
        
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "password_hash": get_password_hash(request.new_password),
                "sessions": [],
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"detail": "Password updated successfully. All sessions have been revoked."}

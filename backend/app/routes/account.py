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

class DeleteAccountRequest(BaseModel):
    password: str

@router.delete("/")
async def delete_account(
    request: DeleteAccountRequest,
    current_user: dict = Depends(get_current_user)
):
    if not verify_password(request.password, current_user.get("password_hash")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
        
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    user_id_str = str(user_id)
    
    # Find all documents for user to clean up Cloudinary assets
    documents = await db.documents.find({"user_id": user_id_str}).to_list(length=None)
    
    from app.utils.cloudinary_helper import delete_document
    import logging
    logger = logging.getLogger(__name__)

    for doc in documents:
        public_id = doc.get("cloudinary_public_id")
        if public_id:
            try:
                res = delete_document(public_id)
                # Cloudinary returns 'ok' or 'not found' typically
                if res.get("result") not in ("ok", "not found", "error"):
                    logger.error(f"Unexpected Cloudinary deletion response for {public_id}: {res}")
                elif res.get("result") == "error":
                    logger.error(f"Cloudinary deletion error for {public_id}: {res.get('error')}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to clean up stored document assets. Please try again later."
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Exception during Cloudinary deletion for {public_id}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to clean up stored document assets. Please try again later."
                )
                
    # Cloudinary cleanup succeeded (or no documents existed), proceed with database deletion
    await db.documents.delete_many({"user_id": user_id_str})
    await db.study_sessions.delete_many({"user_id": user_id_str})
    await db.question_sessions.delete_many({"user_id": user_id_str})
    await db.users.delete_one({"_id": user_id})
    
    return {"detail": "Account and all associated data deleted successfully"}

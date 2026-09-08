import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from pymongo import ReturnDocument

from app.database import get_database
from app.routes.auth import get_current_user
from app.config import settings
from app.services.ai.cache import generate_cache_key
from app.services.ai.worker import process_study_session_task

router = APIRouter(prefix="/api/ai/study", tags=["AI Study"])

class StudyRequest(BaseModel):
    document_id: str = Field(..., description="The ID of the processed document")
    detail_level: str = Field("standard", description="Level of detail for the study material")

class StudySessionResponse(BaseModel):
    session_id: str
    status: str
    cached: Optional[bool] = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, str]] = None

@router.post("", response_model=StudySessionResponse)
async def create_study_session(
    request: StudyRequest, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # 1. Load document and verify
    document = await db.documents.find_one({"_id": request.document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    if document.get("user_id") != (current_user.get("_id") or current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not authorized to access this document.")
        
    if document.get("status") != "Processed":
        raise HTTPException(status_code=400, detail="Document must be in Processed status to generate study material.")
        
    if not document.get("extracted_text"):
        raise HTTPException(status_code=400, detail="Document has no extracted text.")
        
    file_hash = document.get("file_hash", "")
    
    # 2. Rate Limiting (MongoDB based)
    active_count = await db.study_sessions.count_documents({
        "user_id": (current_user.get("_id") or current_user.get("id")),
        "status": {"$in": ["Queued", "Generating"]}
    })
    
    if active_count >= 2:
        raise HTTPException(status_code=429, detail="Maximum active AI generations reached. Please wait for them to finish.")
        
    # 3. Cache Identity
    configuration = {"detail_level": request.detail_level}
    cache_key = generate_cache_key(
        user_id=(current_user.get("_id") or current_user.get("id")),
        document_id=request.document_id,
        document_content_hash=file_hash,
        mode="study",
        configuration=configuration,
        provider=settings.ai_provider,
        model=settings.ai_model,
        prompt_version=settings.ai_prompt_version
    )
    
    # 4. Check for completed cache hit
    existing_completed = await db.study_sessions.find_one({"cache_key": cache_key, "status": "Completed"})
    if existing_completed:
        return StudySessionResponse(
            session_id=existing_completed["_id"],
            status="Completed",
            cached=True
        )
        
    # 5. Race-condition safe atomic insertion
    new_session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    # Try to insert Queued IF no Queued/Generating exists for this cache_key
    session = await db.study_sessions.find_one_and_update(
        {
            "cache_key": cache_key,
            "status": {"$in": ["Queued", "Generating"]}
        },
        {
            "$setOnInsert": {
                "_id": new_session_id,
                "user_id": (current_user.get("_id") or current_user.get("id")),
                "document_id": request.document_id,
                "status": "Queued",
                "created_at": now,
                "updated_at": now,
                "started_at": None,
                "completed_at": None,
                "error_code": None,
                "error_message": None,
                "result": None,
                "document_content_hash": file_hash,
                "provider": settings.ai_provider,
                "model": settings.ai_model,
                "prompt_version": settings.ai_prompt_version,
                "cache_key": cache_key,
                "configuration": configuration
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    
    if session["_id"] == new_session_id:
        # We inserted a new Queued session. Spawn the background task.
        background_tasks.add_task(process_study_session_task, new_session_id)
        return StudySessionResponse(session_id=new_session_id, status="Queued")
    else:
        # Duplicate active request found. Return existing ID.
        return StudySessionResponse(session_id=session["_id"], status=session["status"])

@router.get("/{session_id}", response_model=StudySessionResponse)
async def get_study_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    session = await db.study_sessions.find_one({"_id": session_id})
    
    if not session or session["user_id"] != (current_user.get("_id") or current_user.get("id")):
        raise HTTPException(status_code=404, detail="Study session not found.")
        
    status = session["status"]
    response = StudySessionResponse(session_id=session_id, status=status)
    
    if status == "Completed":
        response.result = session.get("result")
    elif status == "Failed":
        response.error = {
            "code": session.get("error_code", "UNKNOWN_ERROR"),
            "message": session.get("error_message", "An unknown error occurred.")
        }
        
    return response

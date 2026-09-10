import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from pymongo import ReturnDocument
from bson import ObjectId

from app.database import get_database
from app.routes.auth import get_current_user
from app.config import settings
from app.services.ai.cache import generate_cache_key
from app.services.ai.worker import process_question_session_task

router = APIRouter(prefix="/api/ai/questions", tags=["AI Questions"])

class QuestionRequest(BaseModel):
    document_id: str = Field(..., description="The ID of the processed document")
    question_count: int = Field(5, description="Number of questions to generate")
    difficulty: str = Field("medium", description="Difficulty level")
    question_type: str = Field("mcq", description="Type of questions")

class QuestionSessionResponse(BaseModel):
    session_id: str
    status: str
    cached: Optional[bool] = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, str]] = None

@router.post("", response_model=QuestionSessionResponse)
async def create_question_session(
    request: QuestionRequest, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # 1. Load document and verify
    try:
        doc_obj_id = ObjectId(request.document_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid document ID format.")
        
    document = await db.documents.find_one({"_id": doc_obj_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    if document.get("user_id") != (current_user.get("_id") or current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not authorized to access this document.")
        
    if document.get("status") != "Processed":
        raise HTTPException(status_code=400, detail="Document must be in Processed status to generate questions.")
        
    if not document.get("extracted_text"):
        raise HTTPException(status_code=400, detail="Document has no extracted text.")
        
    file_hash = document.get("file_hash", "")
    
    # 2. Rate Limiting (MongoDB based)
    active_count = await db.question_sessions.count_documents({
        "user_id": (current_user.get("_id") or current_user.get("id")),
        "status": {"$in": ["Queued", "Generating"]}
    })
    
    if active_count >= 2:
        raise HTTPException(status_code=429, detail="Maximum active AI generations reached. Please wait for them to finish.")
        
    # 3. Cache Identity
    configuration = {
        "question_count": request.question_count,
        "difficulty": request.difficulty,
        "question_type": request.question_type
    }
    
    cache_key = generate_cache_key(
        user_id=(current_user.get("_id") or current_user.get("id")),
        document_id=request.document_id,
        document_content_hash=file_hash,
        mode="questions",
        configuration=configuration,
        provider=settings.ai_provider,
        model=settings.ai_model,
        prompt_version=settings.ai_prompt_version
    )
    
    # 4. Check for completed cache hit
    existing_completed = await db.question_sessions.find_one({"cache_key": cache_key, "status": "Completed"})
    if existing_completed:
        return QuestionSessionResponse(
            session_id=existing_completed["_id"],
            status="Completed",
            cached=True
        )
        
    # 5. Race-condition safe atomic insertion
    new_session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    session = await db.question_sessions.find_one_and_update(
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
        background_tasks.add_task(process_question_session_task, new_session_id)
        return QuestionSessionResponse(session_id=new_session_id, status="Queued")
    else:
        return QuestionSessionResponse(session_id=session["_id"], status=session["status"])

@router.get("/{session_id}", response_model=QuestionSessionResponse)
async def get_question_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    session = await db.question_sessions.find_one({"_id": session_id})
    
    if not session or session["user_id"] != (current_user.get("_id") or current_user.get("id")):
        raise HTTPException(status_code=404, detail="Quiz session not found.")
        
    status = session["status"]
    response = QuestionSessionResponse(session_id=session_id, status=status)
    
    if status == "Completed":
        response.result = session.get("result")
    elif status == "Failed":
        response.error = {
            "code": session.get("error_code", "UNKNOWN_ERROR"),
            "message": session.get("error_message", "An unknown error occurred.")
        }
        
    return response

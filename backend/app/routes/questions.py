import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
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
    quiz_status: Optional[str] = "in_progress"
    cached: Optional[bool] = False
    already_active: Optional[bool] = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, str]] = None
    user_answers: Optional[Dict[str, str]] = None
    score: Optional[int] = None
    percentage: Optional[float] = None

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
    
    try:
        session = await db.question_sessions.find_one_and_update(
            {
                "cache_key": cache_key,
                "status": {"$in": ["Queued", "Generating"]}
            },
            {
                "$setOnInsert": {
                    "_id": new_session_id,
                    "user_id": str(current_user.get("_id") or current_user.get("id")),
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
                    "configuration": configuration,
                    "quiz_status": "in_progress",
                    "user_answers": {},
                    "score": None,
                    "percentage": None
                }
            },
            upsert=True,
            return_document=ReturnDocument.AFTER
        )
    except DuplicateKeyError:
        session = await db.question_sessions.find_one(
            {"cache_key": cache_key, "status": {"$in": ["Queued", "Generating"]}}
        )
        if not session:
            existing_completed = await db.question_sessions.find_one({"cache_key": cache_key, "status": "Completed"})
            if existing_completed:
                return QuestionSessionResponse(
                    session_id=existing_completed["_id"],
                    status="Completed",
                    cached=True
                )
            raise HTTPException(status_code=500, detail="Concurrency error while creating session.")
            
        return QuestionSessionResponse(session_id=session["_id"], status=session["status"], already_active=True)
    
    if session["_id"] == new_session_id:
        background_tasks.add_task(process_question_session_task, new_session_id)
        return QuestionSessionResponse(session_id=new_session_id, status="Queued")
    else:
        return QuestionSessionResponse(session_id=session["_id"], status=session["status"], already_active=True)

@router.get("/active", response_model=QuestionSessionResponse)
async def get_active_question_session(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Try to find an active (Queued/Generating) session for this user and document
    active_session = await db.question_sessions.find_one(
        {
            "user_id": (current_user.get("_id") or current_user.get("id")),
            "document_id": document_id,
            "status": {"$in": ["Queued", "Generating"]}
        },
        sort=[("created_at", -1)]
    )
    
    if active_session:
        return QuestionSessionResponse(session_id=active_session["_id"], status=active_session["status"], already_active=True)
    
    raise HTTPException(status_code=404, detail="No active session found.")

@router.get("/{session_id}", response_model=QuestionSessionResponse)
async def get_question_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    session = await db.question_sessions.find_one({"_id": session_id})
    
    if not session or str(session["user_id"]) != str(current_user.get("_id") or current_user.get("id")):
        raise HTTPException(status_code=404, detail="Quiz session not found.")
        
    status = session["status"]
    quiz_status = session.get("quiz_status", "in_progress")
    response = QuestionSessionResponse(
        session_id=session_id, 
        status=status,
        quiz_status=quiz_status,
        user_answers=session.get("user_answers", {}),
        score=session.get("score"),
        percentage=session.get("percentage")
    )
    
    if status == "Completed":
        result_data = session.get("result", {})
        if quiz_status != "submitted" and result_data and "questions" in result_data:
            # Strip correct answers and explanations for incomplete quizzes
            stripped_questions = []
            for q in result_data["questions"]:
                stripped_q = q.copy()
                stripped_q.pop("correct_answer_id", None)
                stripped_q.pop("explanation", None)
                stripped_questions.append(stripped_q)
            
            stripped_result = result_data.copy()
            stripped_result["questions"] = stripped_questions
            response.result = stripped_result
        else:
            response.result = result_data
    elif status == "Failed":
        response.error = {
            "code": session.get("error_code", "UNKNOWN_ERROR"),
            "message": session.get("error_message", "An unknown error occurred.")
        }
        
    return response

class ProgressRequest(BaseModel):
    user_answers: Dict[str, str]

@router.put("/{session_id}/progress", response_model=QuestionSessionResponse)
async def save_question_progress(
    session_id: str,
    request: ProgressRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    session = await db.question_sessions.find_one({"_id": session_id})
    if not session or str(session["user_id"]) != str(current_user.get("_id") or current_user.get("id")):
        raise HTTPException(status_code=404, detail="Quiz session not found.")
        
    if session.get("quiz_status") == "submitted":
        raise HTTPException(status_code=400, detail="Cannot save progress for a submitted quiz.")
        
    now = datetime.now(timezone.utc)
    
    updated_session = await db.question_sessions.find_one_and_update(
        {"_id": session_id},
        {
            "$set": {
                "user_answers": request.user_answers,
                "quiz_status": "pending",
                "updated_at": now
            }
        },
        return_document=ReturnDocument.AFTER
    )
    
    return await get_question_session(session_id, current_user)

@router.post("/{session_id}/submit", response_model=QuestionSessionResponse)
async def submit_question_session(
    session_id: str,
    request: ProgressRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    session = await db.question_sessions.find_one({"_id": session_id})
    if not session or str(session["user_id"]) != str(current_user.get("_id") or current_user.get("id")):
        raise HTTPException(status_code=404, detail="Quiz session not found.")
        
    if session.get("quiz_status") == "submitted":
        raise HTTPException(status_code=400, detail="Quiz already submitted.")
        
    if session.get("status") != "Completed":
        raise HTTPException(status_code=400, detail="Cannot submit a quiz that has not finished generating.")
        
    result_data = session.get("result", {})
    questions = result_data.get("questions", [])
    
    total = len(questions)
    correct = 0
    
    user_answers = request.user_answers
    
    for str_idx, option_id in user_answers.items():
        try:
            idx = int(str_idx)
            if 0 <= idx < total:
                if questions[idx].get("correct_answer_id") == option_id:
                    correct += 1
        except ValueError:
            pass
            
    score = correct
    percentage = (correct / total * 100) if total > 0 else 0
    now = datetime.now(timezone.utc)
    
    updated_session = await db.question_sessions.find_one_and_update(
        {"_id": session_id},
        {
            "$set": {
                "user_answers": user_answers,
                "quiz_status": "submitted",
                "score": score,
                "percentage": percentage,
                "updated_at": now,
                "completed_at": now
            }
        },
        return_document=ReturnDocument.AFTER
    )
    
    return await get_question_session(session_id, current_user)

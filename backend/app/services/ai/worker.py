import logging
from datetime import datetime, timezone
from typing import Dict, Any
from bson import ObjectId

from app.database import get_database
from app.services.ai.factory import get_ai_provider
from app.services.ai.base import AIProviderException
from app.services.ai.chunking import normalize_text, structure_aware_chunking
from app.config import settings

logger = logging.getLogger(__name__)

async def process_study_session_task(session_id: str):
    """
    Background worker for processing a Study Mode generation session.
    """
    db = get_database()
    now = datetime.now(timezone.utc)
    
    # 1. Atomically transition Queued -> Generating
    update_result = await db.study_sessions.update_one(
        {"_id": session_id, "status": "Queued"},
        {"$set": {
            "status": "Generating",
            "started_at": now,
            "updated_at": now
        }}
    )
    
    if update_result.modified_count == 0:
        logger.warning(f"Session {session_id} could not be transitioned to Generating. It may not exist or is already running.")
        return
        
    try:
        # 2. Load the session to get parameters
        session = await db.study_sessions.find_one({"_id": session_id})
        if not session:
            raise Exception("Session disappeared from database.")
            
        document_id = session["document_id"]
        
        # 3. Load the document
        document = await db.documents.find_one({"_id": ObjectId(document_id)})
        if not document:
            raise Exception("Document no longer exists.")
            
        extracted_text = document.get("extracted_text")
        if not extracted_text:
            raise Exception("Document has no extracted text.")
            
        # 4. Pipeline: Normalize -> Chunk -> Provider
        normalized_text = normalize_text(extracted_text)
        chunks = structure_aware_chunking(
            normalized_text, 
            max_chunk_size=settings.ai_max_chunk_size, 
            overlap=settings.ai_chunk_overlap
        )
        
        provider = get_ai_provider()
        
        # Generate
        config = {"timeout": 120} # Give ample time for background tasks
        
        result = await provider.generate_study_material(chunks, config)
        
        # 5. Success -> Persist
        completion_time = datetime.now(timezone.utc)
        await db.study_sessions.update_one(
            {"_id": session_id},
            {"$set": {
                "status": "Completed",
                "result": result.model_dump(),
                "completed_at": completion_time,
                "updated_at": completion_time
            }}
        )
        logger.info(f"Study session {session_id} completed successfully.")
        
    except AIProviderException as e:
        # Expected provider exception
        logger.error(f"AI Provider error for session {session_id}: {str(e)}")
        await _fail_session(session_id, "PROVIDER_ERROR", str(e))
    except Exception as e:
        # Unexpected failure (Never expose raw traces to frontend)
        logger.exception(f"Unexpected error in worker for session {session_id}")
        await _fail_session(session_id, "INTERNAL_ERROR", "An unexpected error occurred during generation.")

async def _fail_session(session_id: str, error_code: str, error_message: str):
    db = get_database()
    now = datetime.now(timezone.utc)
    await db.study_sessions.update_one(
        {"_id": session_id},
        {"$set": {
            "status": "Failed",
            "error_code": error_code,
            "error_message": error_message,
            "completed_at": now,
            "updated_at": now
        }}
    )

async def process_question_session_task(session_id: str):
    """
    Background worker for processing a Question Mode generation session.
    """
    db = get_database()
    now = datetime.now(timezone.utc)
    
    # 1. Atomically transition Queued -> Generating
    update_result = await db.question_sessions.update_one(
        {"_id": session_id, "status": "Queued"},
        {"$set": {
            "status": "Generating",
            "started_at": now,
            "updated_at": now
        }}
    )
    
    if update_result.modified_count == 0:
        logger.warning(f"Question session {session_id} could not be transitioned to Generating. It may not exist or is already running.")
        return
        
    try:
        # 2. Load the session to get parameters
        session = await db.question_sessions.find_one({"_id": session_id})
        if not session:
            raise Exception("Session disappeared from database.")
            
        document_id = session["document_id"]
        configuration = session.get("configuration", {})
        
        # 3. Load the document
        document = await db.documents.find_one({"_id": ObjectId(document_id)})
        if not document:
            raise Exception("Document no longer exists.")
            
        extracted_text = document.get("extracted_text")
        if not extracted_text:
            raise Exception("Document has no extracted text.")
            
        # 4. Pipeline: Normalize -> Chunk -> Provider
        normalized_text = normalize_text(extracted_text)
        chunks = structure_aware_chunking(
            normalized_text, 
            max_chunk_size=settings.ai_max_chunk_size, 
            overlap=settings.ai_chunk_overlap
        )
        
        provider = get_ai_provider()
        
        # Generate
        config = {
            "timeout": 120,
            "question_count": configuration.get("question_count", 5),
            "difficulty": configuration.get("difficulty", "medium"),
            "question_type": configuration.get("question_type", "mcq")
        }
        
        result = await provider.generate_quiz(chunks, config)
        
        # 5. Success -> Persist
        completion_time = datetime.now(timezone.utc)
        await db.question_sessions.update_one(
            {"_id": session_id},
            {"$set": {
                "status": "Completed",
                "result": result.model_dump(),
                "completed_at": completion_time,
                "updated_at": completion_time
            }}
        )
        logger.info(f"Question session {session_id} completed successfully.")
        
    except AIProviderException as e:
        logger.error(f"AI Provider error for question session {session_id}: {str(e)}")
        await _fail_question_session(session_id, "PROVIDER_ERROR", str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in worker for question session {session_id}")
        await _fail_question_session(session_id, "INTERNAL_ERROR", "An unexpected error occurred during generation.")

async def _fail_question_session(session_id: str, error_code: str, error_message: str):
    db = get_database()
    now = datetime.now(timezone.utc)
    await db.question_sessions.update_one(
        {"_id": session_id},
        {"$set": {
            "status": "Failed",
            "error_code": error_code,
            "error_message": error_message,
            "completed_at": now,
            "updated_at": now
        }}
    )

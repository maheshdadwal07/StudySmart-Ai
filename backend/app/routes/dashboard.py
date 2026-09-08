from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Dict, Any
from datetime import datetime, timezone
import re
from bson import ObjectId

from app.database import get_database
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    user_id_str = str(user_id)
    
    # 1. Documents Uploaded & Storage Used
    docs_cursor = db.documents.find({"user_id": user_id})
    documents = await docs_cursor.to_list(length=None)
    
    total_docs = len(documents)
    total_size_bytes = sum(doc.get("file_size_bytes", 0) for doc in documents)
    
    mb = total_size_bytes / (1024 * 1024)
    if mb >= 1.0:
        size_str = f"{mb:.1f} MB"
    elif total_size_bytes > 0:
        size_str = f"{round(total_size_bytes / 1024)} KB"
    else:
        size_str = "0 KB"
        
    # 2. Questions Generated
    # We need to count actual questions within completed question sessions
    q_cursor = db.question_sessions.find({"user_id": user_id_str, "status": "Completed"})
    q_sessions = await q_cursor.to_list(length=None)
    
    total_questions = 0
    for s in q_sessions:
        result = s.get("result")
        if result and isinstance(result, dict):
            questions = result.get("questions")
            if isinstance(questions, list):
                total_questions += len(questions)
    
    # 3. Learning Progress
    # As requested, returning "-" since tracking is not implemented
    learning_progress = "—"
    
    return {
        "documents_uploaded": str(total_docs),
        "storage_used": size_str,
        "questions_generated": str(total_questions),
        "learning_progress": learning_progress
    }

@router.get("/search")
async def global_search(
    q: str = Query("", min_length=1),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    
    # Case-insensitive regex search on filename
    regex = re.compile(re.escape(q), re.IGNORECASE)
    
    docs_cursor = db.documents.find({"user_id": user_id, "filename": regex}).limit(10)
    matched_docs = await docs_cursor.to_list(length=10)
    
    results = {
        "documents": [],
        "study_materials": [],
        "questions": []
    }
    
    if not matched_docs:
        return results
        
    doc_ids = [str(doc["_id"]) for doc in matched_docs]
    doc_id_to_name = {str(doc["_id"]): doc.get("filename", "Unknown Document") for doc in matched_docs}
    
    # Populate document results
    for doc in matched_docs:
        results["documents"].append({
            "id": str(doc["_id"]),
            "title": doc.get("filename"),
            "type": "document"
        })
        
    # Fetch related study sessions
    study_cursor = db.study_sessions.find({"user_id": str(user_id), "document_id": {"$in": doc_ids}, "status": "Completed"}).limit(10)
    study_sessions = await study_cursor.to_list(length=10)
    
    for session in study_sessions:
        doc_name = doc_id_to_name.get(session["document_id"], "Unknown Document")
        results["study_materials"].append({
            "id": str(session["_id"]),
            "document_id": session["document_id"],
            "title": f"{doc_name} — Study Notes",
            "type": "study_material"
        })
        
    # Fetch related question sessions
    question_cursor = db.question_sessions.find({"user_id": str(user_id), "document_id": {"$in": doc_ids}, "status": "Completed"}).limit(10)
    question_sessions = await question_cursor.to_list(length=10)
    
    for session in question_sessions:
        doc_name = doc_id_to_name.get(session["document_id"], "Unknown Document")
        results["questions"].append({
            "id": str(session["_id"]),
            "document_id": session["document_id"],
            "title": f"{doc_name} — Practice Questions",
            "type": "questions"
        })
        
    return results

@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    user_id_str = str(user_id)
    
    notifications = []
    
    # Get 5 recent documents
    recent_docs = await db.documents.find({"user_id": user_id}).sort("created_at", -1).limit(5).to_list(length=5)
    for doc in recent_docs:
        notifications.append({
            "id": f"doc_{doc['_id']}",
            "type": "document",
            "title": "Document uploaded",
            "description": doc.get("filename", "Document"),
            "timestamp": doc.get("created_at"),
            "url": "/uploads"
        })
        
    # Get 5 recent completed study sessions
    # We need document filenames, so we'll fetch docs
    study_sessions = await db.study_sessions.find({"user_id": user_id_str, "status": "Completed"}).sort("completed_at", -1).limit(5).to_list(length=5)
    
    doc_ids_to_fetch = set([s["document_id"] for s in study_sessions])
    
    question_sessions = await db.question_sessions.find({"user_id": user_id_str, "status": "Completed"}).sort("completed_at", -1).limit(5).to_list(length=5)
    doc_ids_to_fetch.update([s["document_id"] for s in question_sessions])
    
    doc_map = {}
    if doc_ids_to_fetch:
        docs = await db.documents.find({"_id": {"$in": [ObjectId(did) for did in doc_ids_to_fetch]}}).to_list(length=None)
        doc_map = {str(d["_id"]): d.get("filename", "Document") for d in docs}
        
    for session in study_sessions:
        doc_name = doc_map.get(session["document_id"], "Document")
        timestamp = session.get("completed_at") or session.get("updated_at")
        notifications.append({
            "id": f"study_{session['_id']}",
            "type": "study",
            "title": "Study material ready",
            "description": doc_name,
            "timestamp": timestamp,
            "url": f"/study-mode?docId={session['document_id']}"
        })
        
    for session in question_sessions:
        doc_name = doc_map.get(session["document_id"], "Document")
        timestamp = session.get("completed_at") or session.get("updated_at")
        notifications.append({
            "id": f"quiz_{session['_id']}",
            "type": "quiz",
            "title": "Quiz generated",
            "description": doc_name,
            "timestamp": timestamp,
            "url": f"/question-mode?docId={session['document_id']}"
        })
        
    # Sort descending by timestamp
    # Ensure timestamps have UTC timezone if naive to allow proper sorting and JSON serialization
    def get_tz_aware_timestamp(ts):
        if ts is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts

    for notif in notifications:
        notif["timestamp"] = get_tz_aware_timestamp(notif["timestamp"])

    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Return top 10
    return {"items": notifications[:10]}
    # Return top 10
    return {"items": notifications[:10]}

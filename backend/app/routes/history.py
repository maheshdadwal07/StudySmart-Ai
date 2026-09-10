from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.database import get_database
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["History"])

class HistoryItem(BaseModel):
    session_id: str
    type: str
    document_id: str
    document_name: str
    created_at: datetime
    status: str
    metadata: Dict[str, Any] = {}

class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    page: int
    limit: int
    has_more: bool

@router.get("", response_model=HistoryResponse)
async def get_history(
    type: Optional[str] = Query("all", description="Filter by type: all, study, quiz"),
    search: Optional[str] = Query("", description="Search term for document names"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    user_id_str = str(user_id)
    
    # 1. Fetch user's documents to resolve names and perform in-memory search filtering
    docs_cursor = db.documents.find({"user_id": user_id})
    documents = await docs_cursor.to_list(length=None)
    doc_map = {str(d["_id"]): d.get("filename", "Unknown Document") for d in documents}
    
    # Determine valid document IDs if a search term is provided
    valid_doc_ids = None
    if search:
        search_lower = search.lower()
        valid_doc_ids = [doc_id for doc_id, name in doc_map.items() if search_lower in name.lower()]
        if not valid_doc_ids:
            return HistoryResponse(items=[], page=page, limit=limit, has_more=False)
            
    # 2. Build match conditions
    match_condition = {"user_id": user_id_str}
    if valid_doc_ids is not None:
        match_condition["document_id"] = {"$in": valid_doc_ids}
        
    # 3. Determine collections to query
    collections_to_query = []
    if type.lower() in ["all", "study"]:
        collections_to_query.append(("Study", db.study_sessions))
    if type.lower() in ["all", "quiz"]:
        collections_to_query.append(("Quiz", db.question_sessions))
        
    # 4. Fetch and combine (since we paginate globally, and motor/mongodb doesn't expose easy unionWith 
    # without raw pipelines, we'll use a fast pipeline approach if available, or just fetch limited sets)
    # Using an aggregation pipeline with $unionWith is optimal for global sorting and pagination.
    
    if not collections_to_query:
        return HistoryResponse(items=[], page=page, limit=limit, has_more=False)
        
    if len(collections_to_query) == 1:
        c_type, collection = collections_to_query[0]
        cursor = collection.find(match_condition).sort("created_at", -1).skip((page - 1) * limit).limit(limit + 1)
        raw_items = await cursor.to_list(length=limit + 1)
        
        items = []
        for raw in raw_items[:limit]:
            meta = {}
            if c_type == "Quiz" and "configuration" in raw:
                meta = raw["configuration"]
            items.append(HistoryItem(
                session_id=str(raw["_id"]),
                type=c_type,
                document_id=raw["document_id"],
                document_name=doc_map.get(raw["document_id"], "Unknown Document"),
                created_at=raw["created_at"],
                status=raw["status"],
                metadata=meta
            ))
            
        has_more = len(raw_items) > limit
        return HistoryResponse(items=items, page=page, limit=limit, has_more=has_more)
        
    # For 'all', we use $unionWith
    pipeline = [
        { "$match": match_condition },
        { "$addFields": { "history_type": "Study" } },
        { "$unionWith": {
            "coll": "question_sessions",
            "pipeline": [
                { "$match": match_condition },
                { "$addFields": { "history_type": "Quiz" } }
            ]
        }},
        { "$sort": { "created_at": -1 } },
        { "$skip": (page - 1) * limit },
        { "$limit": limit + 1 }
    ]
    
    cursor = await db.study_sessions.aggregate(pipeline)
    raw_items = await cursor.to_list(length=limit + 1)
    
    items = []
    for raw in raw_items[:limit]:
        c_type = raw.get("history_type", "Unknown")
        meta = {}
        if c_type == "Quiz" and "configuration" in raw:
            meta = raw["configuration"]
            
        items.append(HistoryItem(
            session_id=str(raw["_id"]),
            type=c_type,
            document_id=raw.get("document_id", ""),
            document_name=doc_map.get(raw.get("document_id"), "Unknown Document"),
            created_at=raw.get("created_at"),
            status=raw.get("status", "Unknown"),
            metadata=meta
        ))
        
    has_more = len(raw_items) > limit
    return HistoryResponse(items=items, page=page, limit=limit, has_more=has_more)

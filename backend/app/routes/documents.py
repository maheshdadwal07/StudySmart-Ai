import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, BackgroundTasks
from bson import ObjectId

from app.models.document import DocumentResponse, DocumentListResponse, CloudinaryStorage
from app.database import get_database
from app.routes.auth import get_current_user
from app.utils.cloudinary_helper import upload_document, delete_document
from app.utils.document_parser import process_document_content, DocumentParserException
from app.config import settings

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_MIME_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
ALLOWED_EXTENSIONS = [".pdf", ".docx"]

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # 1. Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
    
    # Check extension
    ext = ""
    if "." in file.filename:
        ext = file.filename[file.filename.rindex("."):].lower()
    
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF and DOCX are allowed.")
    
    # Check size
    file_content = await file.read()
    file_size_bytes = len(file_content)
    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    
    if file_size_bytes > max_size_bytes:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB.")
    
    # Generate Cloudinary public_id
    user_id_str = str(current_user["_id"])
    unique_id = str(uuid.uuid4())
    public_id = f"studysmart/documents/{user_id_str}/{unique_id}{ext}"
    
    # Upload to Cloudinary
    cloudinary_resp = upload_document(file_content, public_id, file.filename)
    
    # Create DB Record
    now = datetime.now(timezone.utc)
    document_dict = {
        "user_id": current_user["_id"],
        "filename": file.filename,
        "file_type": file.content_type,
        "file_size_bytes": file_size_bytes,
        "storage": {
            "provider": "cloudinary",
            "public_id": cloudinary_resp.get("public_id"),
            "asset_id": cloudinary_resp.get("asset_id"),
            "resource_type": "raw",
            "secure_url": cloudinary_resp.get("secure_url")
        },
        "status": "Pending",
        "processing_metadata": {
            "pages": None,
            "error": None
        },
        "created_at": now,
        "updated_at": now
    }
    
    db = get_database()
    try:
        result = await db.documents.insert_one(document_dict)
        document_dict["_id"] = str(result.inserted_id)
        document_dict["user_id"] = str(document_dict["user_id"])
        return document_dict
    except Exception as e:
        # Rollback Cloudinary asset on DB failure
        delete_document(cloudinary_resp.get("public_id"), resource_type="raw")
        raise HTTPException(status_code=500, detail="Failed to save document metadata")

@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    skip = (page - 1) * limit
    
    query = {"user_id": current_user["_id"]}
    total = await db.documents.count_documents(query)
    
    cursor = db.documents.find(query).sort("created_at", -1).skip(skip).limit(limit)
    documents = await cursor.to_list(length=limit)
    
    # Format for response
    for doc in documents:
        doc["_id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])
        
    return {
        "items": documents,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db = get_database()
    doc = await db.documents.find_one({"_id": obj_id, "user_id": current_user["_id"]})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document_route(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db = get_database()
    doc = await db.documents.find_one({"_id": obj_id, "user_id": current_user["_id"]})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from Cloudinary
    public_id = doc["storage"]["public_id"]
    resource_type = doc["storage"].get("resource_type", "raw")
    
    cloud_res = delete_document(public_id, resource_type=resource_type)
    if cloud_res.get("result") not in ["ok", "not found"]:
        # If Cloudinary deletion fails, we report error and don't delete DB record
        raise HTTPException(status_code=500, detail="Failed to delete file from cloud storage")
        
    # Delete from DB
    await db.documents.delete_one({"_id": obj_id})
    
    return {"detail": "Document deleted successfully"}

async def background_process_document(document_id: str, file_type: str, secure_url: str, public_id: str = None):
    db = get_database()
    obj_id = ObjectId(document_id)
    
    try:
        extracted_text, pages = await process_document_content(file_type, secure_url, public_id)
        
        if not extracted_text:
            raise DocumentParserException("No meaningful text could be extracted from the document.")
            
        if len(extracted_text) > settings.max_extracted_text_chars:
            raise DocumentParserException(f"Extracted text exceeds the maximum allowed length of {settings.max_extracted_text_chars} characters.")
            
        now = datetime.now(timezone.utc)
        
        # Success Update
        await db.documents.update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "status": "Processed",
                    "extracted_text": extracted_text,
                    "processing_metadata.pages": pages,
                    "processing_metadata.error": None,
                    "updated_at": now
                }
            }
        )
        
    except Exception as e:
        now = datetime.now(timezone.utc)
        error_message = str(e) if isinstance(e, DocumentParserException) else "An unexpected error occurred during processing."
        
        # Failure Update
        await db.documents.update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "status": "Failed",
                    "processing_metadata.error": error_message,
                    "updated_at": now
                }
            }
        )

@router.post("/{document_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def process_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db = get_database()
    doc = await db.documents.find_one({"_id": obj_id, "user_id": current_user["_id"]})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.get("status") == "Processing":
        raise HTTPException(status_code=400, detail="Document is already processing")
        
    if doc.get("status") == "Processed":
        raise HTTPException(status_code=400, detail="Document is already processed")
        
    storage = doc.get("storage", {})
    secure_url = storage.get("secure_url")
    
    if not secure_url:
        raise HTTPException(status_code=500, detail="Document storage URL is missing")
        
    # Set status to Processing
    now = datetime.now(timezone.utc)
    await db.documents.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "Processing",
                "updated_at": now
            }
        }
    )
    
    # Queue background task
    background_tasks.add_task(
        background_process_document,
        document_id=document_id,
        file_type=doc.get("file_type"),
        secure_url=secure_url,
        public_id=storage.get("public_id")
    )
    
    return {"detail": "Processing started", "status": "Processing"}

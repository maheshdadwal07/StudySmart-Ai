import uuid
import re
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, BackgroundTasks
import cloudinary.utils
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

def sanitize_filename(filename: str) -> str:
    filename = filename.replace("\\", "/").split("/")[-1]
    filename = re.sub(r'[\x00-\x1f]', '', filename)
    filename = re.sub(r'[^\w\s.-]', '', filename)
    filename = filename.strip()
    if not filename:
        return "document"
    if len(filename) > 100:
        ext_idx = filename.rfind(".")
        if ext_idx > 0:
            ext = filename[ext_idx:]
            name = filename[:ext_idx]
            filename = name[:100-len(ext)] + ext
        else:
            filename = filename[:100]
    return filename

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
    
    safe_filename = sanitize_filename(file.filename)
    
    ext = ""
    if "." in safe_filename:
        ext = safe_filename[safe_filename.rindex("."):].lower()
    
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF and DOCX are allowed.")
    
    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    
    first_chunk = await file.read(2048)
    if not first_chunk:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
    if ext == ".pdf" and not first_chunk.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid PDF file content.")
    elif ext == ".docx" and not first_chunk.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=400, detail="Invalid DOCX file content.")
        
    import hashlib
    hash_obj = hashlib.sha256()
    
    file_content = bytearray(first_chunk)
    hash_obj.update(first_chunk)
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        file_content.extend(chunk)
        hash_obj.update(chunk)
        if len(file_content) > max_size_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB.")
            
    file_content = bytes(file_content)
    file_size_bytes = len(file_content)
    file_hash = hash_obj.hexdigest()
    
    if ext == ".docx":
        import zipfile
        import io
        try:
            with zipfile.ZipFile(io.BytesIO(file_content)) as zf:
                namelist = zf.namelist()
                if "[Content_Types].xml" not in namelist or "word/document.xml" not in namelist:
                    raise HTTPException(status_code=400, detail="Invalid DOCX structural requirements.")
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid DOCX archive.")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Malformed DOCX file.")
    
    db = get_database()
    existing_doc = await db.documents.find_one({"user_id": current_user["_id"], "file_hash": file_hash})
    if existing_doc:
        if existing_doc.get("status") in ["Pending", "Processing"]:
            raise HTTPException(status_code=409, detail="This file is already being processed. Please wait until the current upload finishes.")
        else:
            existing_doc["_id"] = str(existing_doc["_id"])
            existing_doc["user_id"] = str(existing_doc["user_id"])
            from fastapi.responses import JSONResponse
            from fastapi.encoders import jsonable_encoder
            return JSONResponse(status_code=200, content=jsonable_encoder(existing_doc))
    
    # Generate Cloudinary public_id
    user_id_str = str(current_user["_id"])
    unique_id = str(uuid.uuid4())
    public_id = f"studysmart/documents/{user_id_str}/{unique_id}{ext}"
    
    # Upload to Cloudinary
    cloudinary_resp = upload_document(file_content, public_id, safe_filename)
    
    # Create DB Record
    now = datetime.now(timezone.utc)
    document_dict = {
        "user_id": current_user["_id"],
        "filename": safe_filename,
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
        "file_hash": file_hash,
        "processing_metadata": {
            "pages": None,
            "error": None
        },
        "created_at": now,
        "updated_at": now
    }
    
    db = get_database()
    try:
        import pymongo.errors
        result = await db.documents.insert_one(document_dict)
        document_dict["_id"] = str(result.inserted_id)
        document_dict["user_id"] = str(document_dict["user_id"])
        return document_dict
    except pymongo.errors.DuplicateKeyError:
        delete_document(cloudinary_resp.get("public_id"), resource_type="raw", delivery_type="authenticated")
        raise HTTPException(status_code=409, detail="This file is already being processed. Please wait until the current upload finishes.")
    except Exception as e:
        # Rollback Cloudinary asset on DB failure
        delete_document(cloudinary_resp.get("public_id"), resource_type="raw", delivery_type="authenticated")
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
    
    delivery_type = "authenticated"
    secure_url = doc.get("storage", {}).get("secure_url", "")
    if "raw/upload/" in secure_url:
        delivery_type = "upload"
    
    cloud_res = delete_document(public_id, resource_type=resource_type, delivery_type=delivery_type)
    if cloud_res.get("result") not in ["ok", "not found"]:
        # If Cloudinary deletion fails, we report error and don't delete DB record
        raise HTTPException(status_code=500, detail="Failed to delete file from cloud storage")
        
    # Delete from DB
    await db.documents.delete_one({"_id": obj_id})
    
    return {"detail": "Document deleted successfully"}

async def background_process_document(document_id: str, file_type: str, secure_url: str, public_id: str = None):
    db = get_database()
    obj_id = ObjectId(document_id)
    
    if public_id:
        is_legacy_public = False
        if secure_url and "raw/upload/" in secure_url:
            is_legacy_public = True
            
        if not is_legacy_public:
            # Generate authenticated signed URL for processing
            secure_url, _ = cloudinary.utils.cloudinary_url(
                public_id, 
                resource_type="raw", 
                type="authenticated", 
                sign_url=True
            )
    
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
        import traceback
        print(f"Background processing error for document {document_id}: {str(e)}")
        traceback.print_exc()
        
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
        
    storage = doc.get("storage", {})
    secure_url = storage.get("secure_url")
    
    if not secure_url:
        raise HTTPException(status_code=500, detail="Document storage URL is missing")
        
    # Set status to Processing atomically
    now = datetime.now(timezone.utc)
    update_result = await db.documents.update_one(
        {"_id": obj_id, "status": {"$in": ["Pending", "Failed"]}},
        {
            "$set": {
                "status": "Processing",
                "updated_at": now
            }
        }
    )
    
    if update_result.modified_count == 0:
        current_doc = await db.documents.find_one({"_id": obj_id})
        if current_doc and current_doc.get("status") == "Processing":
            raise HTTPException(status_code=409, detail="This document is already being processed.")
        raise HTTPException(status_code=400, detail="Document cannot be processed in its current state.")
    
    # Queue background task
    background_tasks.add_task(
        background_process_document,
        document_id=document_id,
        file_type=doc.get("file_type"),
        secure_url=secure_url,
        public_id=storage.get("public_id")
    )
    
    return {"detail": "Processing started", "status": "Processing"}

from pydantic import BaseModel, Field
class DocumentRenameRequest(BaseModel):
    filename: str = Field(..., description="The new filename")

@router.patch("/{document_id}", response_model=DocumentResponse)
async def rename_document(
    document_id: str,
    request: DocumentRenameRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db = get_database()
    doc = await db.documents.find_one({"_id": obj_id})
    
    if not doc or doc.get("user_id") != current_user["_id"]:
        raise HTTPException(status_code=404, detail="Document not found")
        
    old_filename = doc.get("filename", "")
    new_filename = request.filename.strip()
    
    if not new_filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")
        
    # Preserve extension
    ext = ""
    if "." in old_filename:
        ext = old_filename[old_filename.rindex("."):].lower()
        
    if not new_filename.lower().endswith(ext):
        new_filename += ext
        
    safe_filename = sanitize_filename(new_filename)
    if not safe_filename or safe_filename == ext:
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    now = datetime.now(timezone.utc)
    await db.documents.update_one(
        {"_id": obj_id},
        {"$set": {"filename": safe_filename, "updated_at": now}}
    )
    
    updated_doc = await db.documents.find_one({"_id": obj_id})
    updated_doc["_id"] = str(updated_doc["_id"])
    updated_doc["user_id"] = str(updated_doc["user_id"])
    return updated_doc

@router.get("/{document_id}/preview")
async def preview_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(document_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db = get_database()
    doc = await db.documents.find_one({"_id": obj_id})
    
    if not doc or doc.get("user_id") != current_user["_id"]:
        raise HTTPException(status_code=404, detail="Document not found")
        
    storage = doc.get("storage", {})
    public_id = storage.get("public_id")
    resource_type = storage.get("resource_type", "raw")
    
    if not public_id:
        raise HTTPException(status_code=404, detail="Document asset not found")
        
    secure_url = storage.get("secure_url", "")
    is_legacy_public = False
    if secure_url and "raw/upload/" in secure_url:
        is_legacy_public = True
        
    if is_legacy_public:
        return {"url": secure_url}
        
    try:
        signed_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type="authenticated",
            sign_url=True,
            expires_at=int(datetime.now(timezone.utc).timestamp()) + 3600 # 1 hour
        )
        return {"url": signed_url}
    except Exception as e:
        import logging
        logging.error(f"Failed to generate signed URL for document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate secure preview URL")


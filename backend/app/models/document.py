from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CloudinaryStorage(BaseModel):
    provider: str = "cloudinary"
    public_id: str
    asset_id: str
    resource_type: str = "raw"
    secure_url: str

class ProcessingMetadata(BaseModel):
    pages: Optional[int] = None
    error: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    filename: str
    file_type: str
    file_size_bytes: int
    storage: CloudinaryStorage
    status: str
    processing_metadata: ProcessingMetadata
    created_at: datetime
    updated_at: datetime
    
class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    limit: int

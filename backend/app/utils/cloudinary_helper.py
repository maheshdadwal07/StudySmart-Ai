import cloudinary
import cloudinary.uploader
import cloudinary.api
from fastapi import HTTPException, status
from app.config import settings

def init_cloudinary():
    if not settings.cloudinary_cloud_name or not settings.cloudinary_api_key or not settings.cloudinary_api_secret:
        print("Warning: Cloudinary credentials are not fully configured.")
        return False
        
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )
    return True

def upload_document(file_content: bytes, public_id: str, original_filename: str) -> dict:
    """Uploads a document to Cloudinary as a raw resource type."""
    try:
        response = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            resource_type="raw",
            # We preserve the extension in Cloudinary
            use_filename=True,
            unique_filename=False
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Cloudinary upload failed: {str(e)}")

def delete_document(public_id: str, resource_type: str = "raw") -> dict:
    """Deletes a document from Cloudinary."""
    try:
        response = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return response
    except Exception as e:
        # We don't raise HTTP exception here, let the caller handle it if needed
        print(f"Cloudinary deletion failed: {e}")
        return {"result": "error", "error": str(e)}

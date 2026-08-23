import asyncio
from app.config import settings
from app.utils.cloudinary_helper import init_cloudinary
from app.database import connect_to_mongo, get_database, close_mongo_connection
import cloudinary.utils
import httpx
from bson import ObjectId

async def main():
    await connect_to_mongo()
    init_cloudinary()
    db = get_database()
    
    # Find the document that is stuck in Processing
    doc = await db.documents.find_one({"status": "Processing"})
    if not doc:
        print("No document in Processing status found.")
        # Just find any document
        doc = await db.documents.find_one()
        if not doc:
            print("No documents found.")
            return

    print(f"Found document: {doc['filename']}")
    public_id = doc['storage']['public_id']
    
    secure_url, _ = cloudinary.utils.cloudinary_url(
        public_id, 
        resource_type="raw", 
        type="authenticated", 
        sign_url=True
    )
    
    print(f"Signed URL: {secure_url}")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(secure_url, timeout=30.0, headers={"User-Agent": "Mozilla/5.0"})
        print(f"Download status: {response.status_code}")
        if response.status_code == 200:
            print(f"Downloaded {len(response.content)} bytes.")
        else:
            print(response.text)
            
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())

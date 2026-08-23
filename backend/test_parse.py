import asyncio
import io
from app.database import connect_to_mongo, get_database, close_mongo_connection
import httpx
from pypdf import PdfReader

async def main():
    await connect_to_mongo()
    db = get_database()
    
    doc = await db.documents.find_one({"filename": {"$regex": "WEEK.*"}})
    if not doc:
        print("Not found")
        return
        
    url = doc['storage']['secure_url']
    print("URL:", url)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        print("Download status:", response.status_code)
        
        file_content = response.content
        print("First 10 bytes:", file_content[:10])
        
        try:
            reader = PdfReader(io.BytesIO(file_content))
            print("PDF parsed successfully, pages:", len(reader.pages))
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

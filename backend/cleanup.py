import asyncio
from app.database import connect_to_mongo, get_database, close_mongo_connection
from app.utils.cloudinary_helper import init_cloudinary, delete_document

async def main():
    await connect_to_mongo()
    db = get_database()
    init_cloudinary()
    
    # Find the user who uploaded "Criteria & Process.pdf"
    doc_match = await db.documents.find_one({"filename": {"$regex": "Criteria.*"}})
    if not doc_match:
        # Try finding the WEEK 1 document
        doc_match = await db.documents.find_one({"filename": {"$regex": "WEEK.*"}})
        
    if not doc_match:
        print("Could not identify the user based on test documents.")
        return
        
    user_id = doc_match["user_id"]
    user = await db.users.find_one({"_id": user_id})
    print(f"Cleaning up documents for user: {user.get('email', user_id)}")
    
    cursor = db.documents.find({"user_id": user_id})
    documents = await cursor.to_list(length=1000)
    
    print(f"Found {len(documents)} documents to delete.")
    
    for doc in documents:
        print(f"Deleting document {doc['filename']} ({doc['_id']})")
        
        # Delete from Cloudinary
        public_id = doc["storage"]["public_id"]
        resource_type = doc["storage"].get("resource_type", "raw")
        
        delivery_type = "authenticated"
        secure_url = doc.get("storage", {}).get("secure_url", "")
        if "raw/upload/" in secure_url:
            delivery_type = "upload"
            
        print(f"  Cloudinary delete: {public_id}, type={delivery_type}")
        cloud_res = delete_document(public_id, resource_type=resource_type, delivery_type=delivery_type)
        print(f"  Cloudinary response: {cloud_res}")
        
        # Delete from DB
        await db.documents.delete_one({"_id": doc["_id"]})
        print(f"  DB delete successful.")
        
    print("Cleanup complete.")
    
if __name__ == "__main__":
    asyncio.run(main())

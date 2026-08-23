import asyncio
from app.database import connect_to_mongo, get_database, close_mongo_connection
from app.routes.documents import process_document
from app.utils.cloudinary_helper import init_cloudinary
from fastapi import BackgroundTasks
from bson import ObjectId

class MockBackgroundTasks:
    def add_task(self, func, *args, **kwargs):
        print(f"Added task: {func.__name__} with args {args} kwargs {kwargs}")
        self.func = func
        self.kwargs = kwargs

async def main():
    await connect_to_mongo()
    init_cloudinary()
    db = get_database()
    
    doc = await db.documents.find_one({"filename": {"$regex": "WEEK.*"}})
    if not doc:
        print("Not found")
        return
        
    # Reset status so it processes
    await db.documents.update_one({"_id": doc["_id"]}, {"$set": {"status": "Pending"}})
        
    bg_tasks = MockBackgroundTasks()
    current_user = {"_id": doc["user_id"]}
    
    try:
        res = await process_document(str(doc["_id"]), bg_tasks, current_user)
        print("Response:", res)
        print("Running background task...")
        await bg_tasks.func(**bg_tasks.kwargs)
    except Exception as e:
        import traceback
        traceback.print_exc()
        
    # Check status now
    doc_after = await db.documents.find_one({"_id": doc["_id"]})
    print("Status after:", doc_after["status"])
    print("Processing metadata:", doc_after.get("processing_metadata"))
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())

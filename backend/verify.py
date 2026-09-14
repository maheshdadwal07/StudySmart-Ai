import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb+srv://maheshdadwal07_db_user:Y6YeHHziVAP3smhG@studysmart.ieqlt1v.mongodb.net/?appName=StudySmart')
    db = client.studysmart
    res = await db.users.update_one({'email': 'maheshdadwal07@gmail.com'}, {'$set': {'email_verified': True}})
    print('Modified:', res.modified_count)

asyncio.run(main())

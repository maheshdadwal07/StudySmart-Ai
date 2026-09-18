import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.utils.stats import get_user_statistics

load_dotenv()

async def main():
    uri = os.getenv('MONGODB_URI')
    db_name = os.getenv('DATABASE_NAME')
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    user = await db.users.find_one({'email': 'mahesh0562.be23@chitkara.edu.in'})
    user_id_str = str(user['_id'])
    print('User ID:', user_id_str)
    
    sessions = await db.question_sessions.find({'user_id': user_id_str}).to_list(None)
    print(f'Total question sessions: {len(sessions)}')
    
    submitted = [s for s in sessions if s.get('quiz_status') == 'submitted']
    print(f'Submitted sessions: {len(submitted)}')
    
    valid = []
    total_q = 0
    total_c = 0
    
    for s in submitted:
        if s.get('score') is not None:
            qs = s.get('result', {}).get('questions', [])
            if len(qs) > 0:
                valid.append(s)
                total_q += len(qs)
                total_c += s['score']
                print(f'- Valid Session: _id={s["_id"]} score={s["score"]} q_count={len(qs)} completed_at={s.get("completed_at")}')
    
    print(f'Valid submitted sessions: {len(valid)}')
    print(f'Total valid questions: {total_q}')
    print(f'Total correct answers: {total_c}')
    if total_q > 0:
        print(f'Overall Percentage: {(total_c/total_q)*100}%')

    print('\n--- API Output ---')
    stats = await get_user_statistics(db, user['_id'], user_id_str)
    print(f'learning_progress: {stats.get("learning_progress")}')
    print(f'progress.weekly: {stats.get("progress", {}).get("weekly")}')
    print(f'progress.monthly: {stats.get("progress", {}).get("monthly")}')

asyncio.run(main())

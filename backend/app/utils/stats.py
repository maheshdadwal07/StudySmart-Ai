async def get_user_statistics(db, user_id, user_id_str):
    # 1. Documents Uploaded & Storage Used
    docs_cursor = db.documents.find({"user_id": user_id})
    documents = await docs_cursor.to_list(length=None)
    
    total_docs = len(documents)
    total_size_bytes = sum(doc.get("file_size_bytes", 0) for doc in documents)
    
    mb = total_size_bytes / (1024 * 1024)
    if mb >= 1.0:
        size_str = f"{mb:.1f} MB"
    elif total_size_bytes > 0:
        size_str = f"{round(total_size_bytes / 1024)} KB"
    else:
        size_str = "0 KB"
        
    # 2. Questions Generated
    q_cursor = db.question_sessions.find({"user_id": user_id_str, "status": "Completed"})
    q_sessions = await q_cursor.to_list(length=None)
    
    total_questions = 0
    for s in q_sessions:
        result = s.get("result")
        if result and isinstance(result, dict):
            questions = result.get("questions")
            if isinstance(questions, list):
                total_questions += len(questions)
    
    # 3. Learning Progress
    learning_progress = "—"
    
    # 4. Study Sessions
    study_cursor = db.study_sessions.find({"user_id": user_id_str, "status": "Completed"})
    study_sessions = await study_cursor.to_list(length=None)
    total_study_sessions = len(study_sessions)

    return {
        "documents_uploaded": str(total_docs),
        "storage_used": size_str,
        "questions_generated": str(total_questions),
        "learning_progress": learning_progress,
        "study_sessions": str(total_study_sessions)
    }

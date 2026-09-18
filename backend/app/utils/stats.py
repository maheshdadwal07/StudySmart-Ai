from datetime import datetime, timedelta, timezone

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
    
    # Study Sessions Generated
    study_cursor = db.study_sessions.find({"user_id": user_id_str, "status": "Completed"})
    study_sessions = await study_cursor.to_list(length=None)
    total_study_sessions = len(study_sessions)

    now = datetime.now(timezone.utc)
    
    # Ensure completed_at is set for proper date tracking; fallback to updated_at or created_at
    def get_date(session):
        dt = session.get("completed_at") or session.get("updated_at") or session.get("created_at")
        if dt and dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt or now

    # 3. Learning Progress (Overall & Weekly)
    overall_correct = 0
    overall_attempted = 0
    weekly_correct = 0
    weekly_attempted = 0
    
    # Progress charting data
    daily_stats = { (now - timedelta(days=i)).strftime('%Y-%m-%d'): {"correct": 0, "attempted": 0} for i in range(7) }
    
    # Monthly chart data (Calendar month based: Current + previous 5 months)
    monthly_stats = {}
    for i in range(6):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_key = f"{y}-{m:02d}"
        monthly_stats[month_key] = {"correct": 0, "attempted": 0, "year": y, "month": m}
    
    # Activity tracking
    activity = {
        "7d": {"study": 0, "quiz": 0},
        "30d": {"study": 0, "quiz": 0},
        "90d": {"study": 0, "quiz": 0},
    }

    # Track activity for study sessions
    for s in study_sessions:
        dt = get_date(s)
        days_ago = (now - dt).days
        if days_ago <= 7:
            activity["7d"]["study"] += 1
        if days_ago <= 30:
            activity["30d"]["study"] += 1
        if days_ago <= 90:
            activity["90d"]["study"] += 1

    # Process valid submitted quizzes for progress and activity
    for s in q_sessions:
        dt = get_date(s)
        days_ago = (now - dt).days
        
        # Valid Question Mode usage is simply completed generation
        if days_ago <= 7:
            activity["7d"]["quiz"] += 1
        if days_ago <= 30:
            activity["30d"]["quiz"] += 1
        if days_ago <= 90:
            activity["90d"]["quiz"] += 1

        # Only use valid submitted quizzes for Learning Progress
        if s.get("quiz_status") != "submitted" or s.get("score") is None:
            continue
            
        result = s.get("result", {})
        questions = result.get("questions", [])
        attempted = len(questions)
        correct = s.get("score", 0)
        
        if attempted == 0:
            continue
            
        overall_correct += correct
        overall_attempted += attempted
        
        if days_ago < 7:
            weekly_correct += correct
            weekly_attempted += attempted
            
            date_str = dt.strftime('%Y-%m-%d')
            if date_str in daily_stats:
                daily_stats[date_str]["correct"] += correct
                daily_stats[date_str]["attempted"] += attempted
                
        # Calendar month matching
        month_key = f"{dt.year}-{dt.month:02d}"
        if month_key in monthly_stats:
            monthly_stats[month_key]["correct"] += correct
            monthly_stats[month_key]["attempted"] += attempted

    # Format progress values
    learning_progress = round((overall_correct / overall_attempted) * 100) if overall_attempted > 0 else "—"
    weekly_progress = round((weekly_correct / weekly_attempted) * 100) if weekly_attempted > 0 else "—"

    # Format chart data
    progress_weekly = []
    # Sort dates from oldest to newest (7 days ago to today)
    for date_str in sorted(daily_stats.keys()):
        stats = daily_stats[date_str]
        val = round((stats["correct"] / stats["attempted"]) * 100) if stats["attempted"] > 0 else None
        
        # Parse day of week
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        day_name = dt.strftime('%a')
        
        progress_weekly.append({
            "label": day_name,
            "value": val
        })
        
    progress_monthly = []
    # Sort keys chronologically (e.g. '2026-04' -> '2026-09')
    for month_key in sorted(monthly_stats.keys()):
        stats = monthly_stats[month_key]
        val = round((stats["correct"] / stats["attempted"]) * 100) if stats["attempted"] > 0 else None
        
        month_name = datetime(stats["year"], stats["month"], 1).strftime('%b')
        if stats["year"] != now.year:
            label = f"{month_name} '{str(stats['year'])[-2:]}"
        else:
            label = month_name
            
        progress_monthly.append({
            "label": label,
            "value": val
        })

    return {
        "documents_uploaded": str(total_docs),
        "storage_used": size_str,
        "questions_generated": str(total_questions),
        "study_sessions": str(total_study_sessions),
        "learning_progress": learning_progress,
        "weekly_progress": weekly_progress,
        "progress": {
            "weekly": progress_weekly,
            "monthly": progress_monthly
        },
        "activity": activity
    }

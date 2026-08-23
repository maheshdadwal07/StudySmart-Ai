import pytest
from app.services.ai.chunking import normalize_text, structure_aware_chunking
from app.services.ai.cache import generate_cache_key
from app.models.ai import StudyMaterialResponse, QuizResponse, Question, QuestionOption
from pydantic import ValidationError

def test_normalize_text():
    raw_text = "This   is  some text.\n\n\n\nIt has   too much whitespace. \n\n \n\n And  weird   spacing."
    normalized = normalize_text(raw_text)
    
    assert "This is some text." in normalized
    assert "It has too much whitespace." in normalized
    assert "\n\n\n" not in normalized
    assert "\n\nAnd weird spacing." in normalized

def test_structure_aware_chunking():
    text = "Paragraph 1 is here.\n\nParagraph 2 is slightly longer.\n\nParagraph 3 is also here."
    chunks = structure_aware_chunking(text, max_chunk_size=40, overlap=10)
    
    # "Paragraph 1 is here." -> 20 chars
    # "\n\nParagraph 2 is slightly longer." -> 33 chars (total > 40)
    assert len(chunks) == 3
    assert chunks[0]["text"] == "Paragraph 1 is here."
    assert "Paragraph 2" in chunks[1]["text"]
    assert "Paragraph 3" in chunks[2]["text"]

def test_structure_aware_chunking_giant_paragraph():
    text = "A" * 100
    chunks = structure_aware_chunking(text, max_chunk_size=40, overlap=10)
    
    assert len(chunks) == 3
    assert len(chunks[0]["text"]) == 40
    assert len(chunks[1]["text"]) == 40
    assert len(chunks[2]["text"]) == 40

def test_deterministic_cache_key():
    config1 = {"question_count": 10, "difficulty": "hard", "type": "mcq"}
    config2 = {"type": "mcq", "difficulty": "hard", "question_count": 10}
    
    key1 = generate_cache_key("u1", "d1", "hash1", "quiz", config1, "gemini", "gemini-1.5-flash", "v1")
    key2 = generate_cache_key("u1", "d1", "hash1", "quiz", config2, "gemini", "gemini-1.5-flash", "v1")
    
    assert key1 == key2

    # Different prompt version produces different key
    key3 = generate_cache_key("u1", "d1", "hash1", "quiz", config1, "gemini", "gemini-1.5-flash", "v2")
    assert key1 != key3

def test_ai_schemas():
    # Valid study
    valid_study = {
        "summary": "This is a summary.",
        "key_points": ["Point 1", "Point 2"],
        "important_concepts": ["Concept 1"],
        "definitions": {"Concept 1": "Definition 1"},
        "revision_notes": "Revise well."
    }
    study = StudyMaterialResponse(**valid_study)
    assert study.summary == "This is a summary."

    # Valid Quiz
    valid_quiz = {
        "questions": [
            {
                "question_text": "Q1",
                "options": [
                    {"id": "a", "text": "Opt A"},
                    {"id": "b", "text": "Opt B"}
                ],
                "correct_answer_id": "a",
                "explanation": "Because A."
            }
        ]
    }
    quiz = QuizResponse(**valid_quiz)
    assert len(quiz.questions) == 1
    assert quiz.questions[0].correct_answer_id == "a"

    # Invalid Quiz
    with pytest.raises(ValidationError):
        QuizResponse(questions=[{"invalid": "data"}])

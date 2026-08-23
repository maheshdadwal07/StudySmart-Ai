from enum import Enum
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class AIStatus(str, Enum):
    QUEUED = "Queued"
    GENERATING = "Generating"
    COMPLETED = "Completed"
    FAILED = "Failed"

# Conceptual Study Material Output Schema
class StudyMaterialResponse(BaseModel):
    summary: str = Field(..., description="A concise summary of the document.")
    key_points: List[str] = Field(..., description="Key points extracted from the document.")
    important_concepts: List[str] = Field(default_factory=list, description="Important concepts and their meanings.")
    definitions: Dict[str, str] = Field(default_factory=dict, description="Key terms and their definitions.")
    revision_notes: Optional[str] = Field(None, description="Additional notes for revision.")

# Conceptual Quiz Output Schema
class QuestionOption(BaseModel):
    id: str = Field(..., description="A unique identifier for this option, e.g., 'a', 'b', 'c', 'd'.")
    text: str = Field(..., description="The text of the option.")

class Question(BaseModel):
    question_text: str = Field(..., description="The main text of the question.")
    options: List[QuestionOption] = Field(..., description="The multiple choice options.")
    correct_answer_id: str = Field(..., description="The id of the correct option.")
    explanation: str = Field(..., description="Explanation for why the answer is correct.")

class QuizResponse(BaseModel):
    questions: List[Question] = Field(..., description="A list of generated questions.")

# Base Session Record
class BaseAISession(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    document_id: str
    status: AIStatus
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    document_content_hash: str
    model: str
    provider: str
    prompt_version: str
    cache_key: str

class StudySessionRecord(BaseAISession):
    result: Optional[StudyMaterialResponse] = None

class QuestionSessionRecord(BaseAISession):
    configuration: Dict[str, Any]
    result: Optional[QuizResponse] = None

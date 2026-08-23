import abc
from typing import List, Dict, Any, Optional
from app.models.ai import StudyMaterialResponse, QuizResponse

class AIProviderException(Exception):
    """Base exception for all AI provider errors."""
    pass

class BaseAIProvider(abc.ABC):
    """Abstract base class for all AI providers."""
    
    @abc.abstractmethod
    async def generate_study_material(
        self, 
        chunks: List[Dict[str, Any]], 
        configuration: Dict[str, Any]
    ) -> StudyMaterialResponse:
        """
        Generates structured study material from document chunks.
        Must return a validated StudyMaterialResponse or raise AIProviderException.
        """
        pass

    @abc.abstractmethod
    async def generate_quiz(
        self, 
        chunks: List[Dict[str, Any]], 
        configuration: Dict[str, Any]
    ) -> QuizResponse:
        """
        Generates structured quiz questions from document chunks.
        Must return a validated QuizResponse or raise AIProviderException.
        """
        pass

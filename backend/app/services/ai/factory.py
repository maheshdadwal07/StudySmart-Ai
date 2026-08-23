from app.config import settings
from app.services.ai.base import BaseAIProvider, AIProviderException
from app.services.ai.gemini import GeminiProvider

def get_ai_provider() -> BaseAIProvider:
    """
    Factory function to resolve and instantiate the active AI Provider 
    based on environment configuration.
    """
    provider_name = settings.ai_provider.lower()
    
    if provider_name == "gemini":
        return GeminiProvider()
    elif provider_name == "openai":
        raise AIProviderException("OpenAI provider is not yet implemented.")
    else:
        raise AIProviderException(f"Unsupported AI provider configured: {provider_name}")

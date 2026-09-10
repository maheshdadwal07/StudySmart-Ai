import asyncio
from app.services.ai.factory import get_ai_provider
from app.config import settings

async def test():
    try:
        print("Using model:", settings.ai_model)
        provider = get_ai_provider()
        chunks = [{"text": "Hello, explain how quantum computing works in 1 sentence."}]
        response = await provider.generate_study_material(chunks, {})
        print("Response:", response.summary)
    except Exception as e:
        print("Error:", repr(e))

asyncio.run(test())

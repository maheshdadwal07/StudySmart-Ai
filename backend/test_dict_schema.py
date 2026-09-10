import asyncio
import json
from app.config import settings
from google import genai
from google.genai import types
from app.models.ai import StudyMaterialResponse

def strip_additional_properties(d):
    if isinstance(d, dict):
        if "additionalProperties" in d:
            del d["additionalProperties"]
        for k, v in d.items():
            strip_additional_properties(v)
    elif isinstance(d, list):
        for item in d:
            strip_additional_properties(item)
    return d

async def test():
    client = genai.Client(api_key=settings.gemini_api_key)
    schema_dict = StudyMaterialResponse.model_json_schema()
    strip_additional_properties(schema_dict)
    
    try:
        response = client.models.generate_content(
            model=settings.ai_model,
            contents="Hello, explain quantum computing in 1 sentence. Use the provided schema.",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema_dict,
                temperature=0.2,
            ),
        )
        print("Response text:", response.text)
    except Exception as e:
        print("Error:", repr(e))

asyncio.run(test())

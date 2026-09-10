import asyncio
from app.models.ai import StudyMaterialResponse
import json

schema = StudyMaterialResponse.model_json_schema()

def strip_additional_properties(d):
    if isinstance(d, dict):
        if "additionalProperties" in d:
            del d["additionalProperties"]
        for k, v in d.items():
            strip_additional_properties(v)
    elif isinstance(d, list):
        for item in d:
            strip_additional_properties(item)

strip_additional_properties(schema)
print(json.dumps(schema, indent=2))

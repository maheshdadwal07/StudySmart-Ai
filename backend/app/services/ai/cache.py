import hashlib
import json
from typing import Any, Dict

def generate_cache_key(
    user_id: str,
    document_id: str,
    document_content_hash: str,
    mode: str,
    configuration: Dict[str, Any],
    provider: str,
    model: str,
    prompt_version: str
) -> str:
    """
    Generates a deterministic SHA-256 cache key for an AI session.
    Canonicalizes the configuration to ensure identical configs produce the same hash.
    """
    # Canonicalize configuration: sort keys and serialize
    canonical_config = json.dumps(configuration, sort_keys=True, separators=(',', ':'))
    
    # Create canonical payload
    payload = {
        "user_id": str(user_id),
        "document_id": str(document_id),
        "document_content_hash": str(document_content_hash),
        "mode": str(mode),
        "configuration": canonical_config,
        "provider": str(provider),
        "model": str(model),
        "prompt_version": str(prompt_version)
    }
    
    canonical_payload = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    
    return hashlib.sha256(canonical_payload.encode('utf-8')).hexdigest()

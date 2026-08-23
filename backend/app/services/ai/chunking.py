import re
from typing import List, Dict, Any

def normalize_text(text: str) -> str:
    """
    Normalizes extracted text.
    - Preserves meaningful paragraph boundaries
    - Normalizes excessive whitespace
    - Removes obviously useless repeated whitespace
    """
    if not text:
        return ""
        
    # Replace multiple spaces with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Replace 3 or more newlines with exactly 2 newlines (paragraph boundary)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Trim trailing/leading whitespace per line, but keep the newlines
    lines = [line.strip() for line in text.split('\n')]
    
    # Rejoin lines
    text = '\n'.join(lines)
    
    # Cleanup empty lines that got isolated
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

def structure_aware_chunking(text: str, max_chunk_size: int, overlap: int) -> List[Dict[str, Any]]:
    """
    Chunks text by natural boundaries (paragraphs).
    Tries to stay under max_chunk_size while keeping a slight overlap.
    Returns metadata about each chunk.
    """
    if not text:
        return []
        
    # Split by double newline (paragraph boundaries)
    paragraphs = text.split('\n\n')
    
    chunks = []
    current_chunk_text = ""
    current_start_char = 0
    
    chunk_index = 0
    
    for i, para in enumerate(paragraphs):
        para = para.strip()
        if not para:
            continue
            
        # If the single paragraph is larger than the max_chunk_size, we have to split it forcefully.
        if len(para) > max_chunk_size:
            # If we already have something in the current chunk, flush it
            if current_chunk_text:
                chunks.append({
                    "index": chunk_index,
                    "text": current_chunk_text.strip(),
                    "start_char": current_start_char,
                    "end_char": current_start_char + len(current_chunk_text)
                })
                chunk_index += 1
                current_chunk_text = ""
                current_start_char += len(chunks[-1]["text"]) + 2
                
            # Now split the giant paragraph safely
            start = 0
            while start < len(para):
                end = min(start + max_chunk_size, len(para))
                
                # Try to find a space boundary if we aren't at the end
                if end < len(para):
                    space_idx = para.rfind(' ', start, end)
                    if space_idx != -1 and space_idx > start:
                        end = space_idx
                
                sub_para = para[start:end].strip()
                if sub_para:
                    chunks.append({
                        "index": chunk_index,
                        "text": sub_para,
                        "start_char": current_start_char,
                        "end_char": current_start_char + len(sub_para)
                    })
                    chunk_index += 1
                    
                # Handle overlap manually for giant paragraphs
                if overlap > 0 and end < len(para):
                    start = max(start, end - overlap)
                else:
                    start = end
                    
            continue

        # If adding this paragraph exceeds max_chunk_size (and the chunk is not empty)
        if len(current_chunk_text) + len(para) + 2 > max_chunk_size and current_chunk_text:
            chunks.append({
                "index": chunk_index,
                "text": current_chunk_text.strip(),
                "start_char": current_start_char,
                "end_char": current_start_char + len(current_chunk_text)
            })
            chunk_index += 1
            
            # Start new chunk with overlap
            # Find the last 'overlap' characters of the previous chunk
            if overlap > 0 and len(current_chunk_text) > overlap:
                # Find a good boundary for the overlap (e.g. space or newline)
                overlap_text = current_chunk_text[-overlap:]
                boundary_idx = overlap_text.find(' ')
                if boundary_idx != -1:
                    overlap_text = overlap_text[boundary_idx:].strip()
                
                current_chunk_text = overlap_text + "\n\n" + para
                current_start_char = current_start_char + len(current_chunk_text) - len(overlap_text) - 2
            else:
                current_chunk_text = para
                current_start_char += len(chunks[-1]["text"]) + 2
        else:
            if current_chunk_text:
                current_chunk_text += "\n\n" + para
            else:
                current_chunk_text = para
        
    # Append the last chunk
    if current_chunk_text:
        chunks.append({
            "index": chunk_index,
            "text": current_chunk_text.strip(),
            "start_char": current_start_char,
            "end_char": current_start_char + len(current_chunk_text)
        })
        
    return chunks

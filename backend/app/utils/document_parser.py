import io
import httpx
from pypdf import PdfReader
from docx import Document

class DocumentParserException(Exception):
    pass

import cloudinary.utils

async def download_document(url: str, public_id: str = None) -> bytes:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0, headers={"User-Agent": "Mozilla/5.0"})
            if response.status_code in [401, 403]:
                raise DocumentParserException(
                    f"Cloudinary Access Denied ({response.status_code}). "
                    f"Please ensure 'Allow delivery of PDF and ZIP files' is enabled in your Cloudinary Security settings."
                )
            if response.status_code != 200:
                raise DocumentParserException(f"Failed to download document. Status: {response.status_code}.")
            return response.content
    except Exception as e:
        if isinstance(e, DocumentParserException):
            raise e
        raise DocumentParserException(f"Failed to download document: {str(e)}")

def parse_pdf(file_content: bytes) -> tuple[str, int]:
    """Returns (extracted_text, page_count)."""
    try:
        reader = PdfReader(io.BytesIO(file_content))
        num_pages = len(reader.pages)
        
        text_chunks = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_chunks.append(page_text)
                
        extracted_text = "\n\n".join(text_chunks).strip()
        return extracted_text, num_pages
    except Exception as e:
        raise DocumentParserException(f"Failed to parse PDF: {str(e)}")

def parse_docx(file_content: bytes) -> tuple[str, None]:
    """Returns (extracted_text, None). DOCX page counts are not reliably available."""
    try:
        doc = Document(io.BytesIO(file_content))
        text_chunks = []
        for para in doc.paragraphs:
            if para.text.strip():
                text_chunks.append(para.text.strip())
                
        extracted_text = "\n\n".join(text_chunks).strip()
        return extracted_text, None
    except Exception as e:
        raise DocumentParserException(f"Failed to parse DOCX: {str(e)}")

async def process_document_content(file_type: str, file_url: str, public_id: str = None) -> tuple[str, int | None]:
    """Downloads and extracts text from a given document."""
    file_content = await download_document(file_url, public_id)
    
    if file_type == "application/pdf":
        return parse_pdf(file_content)
    elif file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return parse_docx(file_content)
    else:
        raise DocumentParserException(f"Unsupported file type for processing: {file_type}")

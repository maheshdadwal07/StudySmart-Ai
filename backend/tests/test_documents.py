import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from unittest.mock import patch
import io
import copy

from app.main import app
from app.config import settings

# Mock DB State
mock_documents_db = {}
mock_users_db = {
    "user1": {"_id": "user1", "email": "user1@example.com"},
    "user2": {"_id": "user2", "email": "user2@example.com"}
}

def get_mock_db():
    class MockCollection:
        def __init__(self, data_store):
            self.data = data_store
            
        async def find_one(self, query):
            for k, v in self.data.items():
                match = True
                for qk, qv in query.items():
                    if qk == "_id":
                        if str(k) != str(qv): match = False
                    elif v.get(qk) != qv:
                        match = False
                if match:
                    res = copy.deepcopy(v)
                    res["_id"] = k
                    return res
            return None
            
        async def insert_one(self, doc):
            new_id = "doc_" + str(len(self.data))
            self.data[new_id] = copy.deepcopy(doc)
            class Result:
                inserted_id = new_id
            return Result()
            
        async def delete_one(self, query):
            doc = await self.find_one(query)
            if doc:
                del self.data[doc["_id"]]
                
        async def update_one(self, query, update):
            doc = await self.find_one(query)
            if doc:
                set_ops = update.get("$set", {})
                for k, v in set_ops.items():
                    if "." in k:
                        parts = k.split(".")
                        if parts[0] not in self.data[doc["_id"]]:
                            self.data[doc["_id"]][parts[0]] = {}
                        self.data[doc["_id"]][parts[0]][parts[1]] = v
                    else:
                        self.data[doc["_id"]][k] = v
                
        def find(self, query):
            class Cursor:
                def __init__(self, data, query):
                    self.data = data
                    self.query = query
                def sort(self, *args): return self
                def skip(self, *args): return self
                def limit(self, *args): return self
                async def to_list(self, length):
                    res = []
                    for k, v in self.data.items():
                        match = True
                        for qk, qv in self.query.items():
                            if v.get(qk) != qv: match = False
                        if match:
                            d = copy.deepcopy(v)
                            d["_id"] = k
                            res.append(d)
                    return res
            return Cursor(self.data, query)

        async def count_documents(self, query):
            count = 0
            for k, v in self.data.items():
                match = True
                for qk, qv in query.items():
                    if v.get(qk) != qv: match = False
                if match: count += 1
            return count

    class MockDB:
        def __init__(self):
            self.documents = MockCollection(mock_documents_db)
            self.users = MockCollection(mock_users_db)
            
    return MockDB()

@pytest.fixture(autouse=True)
def setup_teardown():
    mock_documents_db.clear()
    with patch("app.routes.documents.get_database", side_effect=get_mock_db):
        yield

from app.routes.auth import get_current_user

# Mock dependency
async def override_get_current_user():
    return mock_users_db["user1"]

app.dependency_overrides[get_current_user] = override_get_current_user

# --- TESTS ---

@pytest.fixture
def mock_upload():
    with patch("app.routes.documents.upload_document") as mock:
        mock.return_value = {
            "public_id": "test_public_id",
            "asset_id": "test_asset_id",
            "secure_url": "https://res.cloudinary.com/test/raw/upload/v1/test_public_id.pdf"
        }
        yield mock

@pytest.fixture
def mock_delete():
    with patch("app.routes.documents.delete_document") as mock:
        mock.return_value = {"result": "ok"}
        yield mock

@pytest.mark.asyncio
async def test_upload_valid_pdf(mock_upload):
    pdf_content = b"%PDF-1.4\n%EOF"
    files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
    
    # We must patch get_current_user in routes.documents
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 201
    assert mock_upload.called
    data = response.json()
    assert data["filename"] == "test.pdf"

def create_valid_docx_bytes():
    import zipfile
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", "<Types></Types>")
        zf.writestr("word/document.xml", "<w:document></w:document>")
    return buf.getvalue()

def create_invalid_docx_bytes():
    import zipfile
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("random.txt", "hello")
    return buf.getvalue()

def create_missing_doc_xml_bytes():
    import zipfile
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", "<Types></Types>")
    return buf.getvalue()

@pytest.mark.asyncio
async def test_upload_valid_docx(mock_upload):
    docx_content = create_valid_docx_bytes()
    files = {'file': ('test.docx', io.BytesIO(docx_content), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 201
    assert mock_upload.called

@pytest.mark.asyncio
async def test_upload_malformed_docx(mock_upload):
    # Malformed ZIP renamed to .docx
    docx_content = b"PK\x03\x04not_a_real_zip"
    files = {'file': ('test.docx', io.BytesIO(docx_content), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 400
    assert "Invalid DOCX archive" in response.json()["detail"]

@pytest.mark.asyncio
async def test_upload_random_zip_as_docx(mock_upload):
    docx_content = create_invalid_docx_bytes()
    files = {'file': ('test.docx', io.BytesIO(docx_content), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 400
    assert "structural requirements" in response.json()["detail"]

@pytest.mark.asyncio
async def test_upload_docx_missing_xml(mock_upload):
    docx_content = create_missing_doc_xml_bytes()
    files = {'file': ('test.docx', io.BytesIO(docx_content), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 400
    assert "structural requirements" in response.json()["detail"]

@pytest.mark.asyncio
async def test_upload_invalid_magic_bytes_pdf(mock_upload):
    # A text file renamed to .pdf
    fake_pdf = b"Hello, I am a text file."
    files = {'file': ('fake.pdf', io.BytesIO(fake_pdf), 'application/pdf')}
    
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 400
    assert "Invalid PDF" in response.json()["detail"]
    assert not mock_upload.called

@pytest.mark.asyncio
async def test_upload_invalid_magic_bytes_docx(mock_upload):
    # A text file renamed to .docx
    fake_docx = b"Not a zip file"
    files = {'file': ('fake.docx', io.BytesIO(fake_docx), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 400
    assert "Invalid DOCX" in response.json()["detail"]

@pytest.mark.asyncio
async def test_upload_size_limit(mock_upload):
    # Make settings max upload size small for the test
    with patch("app.routes.documents.settings.max_upload_size_mb", 1):
        # Create a 1.1MB file
        large_content = b"%PDF-1.4\n" + (b"A" * 1024 * 1024 * 1) + b"B" * (100 * 1024)
        files = {'file': ('large.pdf', io.BytesIO(large_content), 'application/pdf')}
        
        with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/documents/upload", files=files)
                
    assert response.status_code == 413
    assert not mock_upload.called

@pytest.mark.asyncio
async def test_filename_sanitization(mock_upload):
    pdf_content = b"%PDF-1.4\n"
    # Evil filename
    files = {'file': ('../../../etc/passwd.pdf', io.BytesIO(pdf_content), 'application/pdf')}
    
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/documents/upload", files=files)
            
    assert response.status_code == 201
    data = response.json()
    assert "passwd" in data["filename"]
    assert "../" not in data["filename"]

@pytest.mark.asyncio
async def test_authorization_list():
    mock_documents_db["doc1"] = {
        "user_id": "user1", 
        "filename": "1.pdf", 
        "file_type": "application/pdf",
        "file_size_bytes": 1024,
        "storage": {"provider": "cloudinary", "public_id": "p1", "asset_id": "a1", "resource_type": "raw", "secure_url": "s1"},
        "status": "Pending",
        "processing_metadata": {"pages": None, "error": None},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    mock_documents_db["doc2"] = {
        "user_id": "user2", 
        "filename": "2.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 1024,
        "storage": {"provider": "cloudinary", "public_id": "p2", "asset_id": "a2", "resource_type": "raw", "secure_url": "s2"},
        "status": "Pending",
        "processing_metadata": {"pages": None, "error": None},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Authenticate as user1
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/documents")
            
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["filename"] == "1.pdf"

@pytest.mark.asyncio
async def test_authorization_get_and_delete(mock_delete):
    mock_documents_db["doc2"] = {
        "user_id": "user2", 
        "filename": "2.pdf", 
        "storage": {"public_id": "test", "resource_type": "raw"}
    }
    
    # user1 trying to access user2's document
    with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res_get = await ac.get("/api/documents/doc2")
            res_del = await ac.delete("/api/documents/doc2")
            
    assert res_get.status_code == 404
    assert res_del.status_code == 404

@pytest.mark.asyncio
async def test_cloudinary_upload_failure():
    pdf_content = b"%PDF-1.4\n"
    files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
    
    with patch("app.routes.documents.upload_document") as mock_upload:
        # FastAPI's exception handler wraps raw Exceptions or HTTPExceptions
        # Let's mock upload_document to raise HTTPException
        from fastapi import HTTPException
        mock_upload.side_effect = HTTPException(status_code=500, detail="Cloudinary upload failed")
        with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/documents/upload", files=files)
                
    assert response.status_code == 500
    assert len(mock_documents_db) == 0

@pytest.mark.asyncio
async def test_db_insert_failure_cleanup(mock_upload, mock_delete):
    pdf_content = b"%PDF-1.4\n"
    files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
    
    class FakeException(Exception): pass
    
    with patch("app.routes.documents.get_database") as mock_get_db:
        mock_db = get_mock_db()
        mock_db.documents.insert_one = lambda x: (_ for _ in ()).throw(FakeException("DB Error"))
        mock_get_db.return_value = mock_db
        
        with patch("app.routes.documents.get_current_user", return_value=mock_users_db["user1"]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/documents/upload", files=files)
                
    assert response.status_code == 500
    assert mock_delete.called

@pytest.mark.asyncio
async def test_process_pdf():
    from app.routes.documents import background_process_document
    # Mock cloudinary url and process_document_content
    with patch("app.routes.documents.cloudinary.utils.cloudinary_url", return_value=("http://signed-url.pdf", {})) as mock_url:
        with patch("app.routes.documents.process_document_content", return_value=("Extracted text", 2)) as mock_process:
            mock_db = get_mock_db()
            valid_id = "012345678901234567890123"
            mock_db.documents.data[valid_id] = {"status": "Processing", "file_type": "application/pdf"}
            
            with patch("app.routes.documents.get_database", return_value=mock_db):
                await background_process_document(valid_id, "application/pdf", "http://old", "public_id_pdf")
                
            assert mock_url.called
            assert mock_process.called
            assert mock_db.documents.data[valid_id]["status"] == "Processed"
            assert mock_db.documents.data[valid_id]["extracted_text"] == "Extracted text"

@pytest.mark.asyncio
async def test_process_docx():
    from app.routes.documents import background_process_document
    with patch("app.routes.documents.cloudinary.utils.cloudinary_url", return_value=("http://signed-url.docx", {})) as mock_url:
        with patch("app.routes.documents.process_document_content", return_value=("Extracted text docx", None)) as mock_process:
            mock_db = get_mock_db()
            valid_id = "012345678901234567890124"
            mock_db.documents.data[valid_id] = {"status": "Processing", "file_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
            
            with patch("app.routes.documents.get_database", return_value=mock_db):
                await background_process_document(valid_id, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "http://old", "public_id_docx")
                
            assert mock_url.called
            assert mock_process.called
            assert mock_db.documents.data[valid_id]["status"] == "Processed"
            assert mock_db.documents.data[valid_id]["extracted_text"] == "Extracted text docx"


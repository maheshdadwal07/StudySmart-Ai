from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, db
from app.routes import auth, documents, study
from app.utils.cloudinary_helper import init_cloudinary

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    init_cloudinary()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="StudySmart AI Backend",
    description="Initial backend foundation for StudySmart AI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(study.router)

@app.get("/api/health")
async def health_check():
    # Optional: We can also verify if mongo is alive here, but for now just returning status ok.
    # A simple ping can be performed if desired.
    mongo_status = "connected" if db.client else "disconnected"
    return {
        "status": "ok",
        "database": mongo_status
    }

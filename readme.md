# StudySmart AI

StudySmart AI is an intelligent SaaS application that allows users to upload documents (PDF, DOCX, PPTX, TXT) and automatically generates study materials like summaries, smart notes, flashcards, and quizzes using AI.

## Architecture

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic
- **Database**: MongoDB
- **AI**: OpenAI / Gemini integration

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.11+
- MongoDB

### Running Locally (Docker)

```bash
docker-compose up --build
```
This will start the backend on port `8000` and MongoDB on `27017`.

### Running Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Backend (without Docker)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

# StudySmart AI Backend

This is the backend for StudySmart AI, built with FastAPI and MongoDB.

## Requirements

- Python 3.10+
- MongoDB instance (local or Atlas)

## Setup Instructions

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy `.env.example` to a new file named `.env` and fill in your values.
   - `MONGODB_URI`: The connection string to your MongoDB (e.g., `mongodb://localhost:27017`)
   - `DATABASE_NAME`: Name of the database to use (e.g., `studysmart_db`)
   - `FRONTEND_URL`: URL of your frontend for CORS (e.g., `http://localhost:3000`)

5. **Start the FastAPI Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Endpoints & Documentation

- **Health Endpoint:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

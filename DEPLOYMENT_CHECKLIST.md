# StudySmart AI Deployment Checklist

This document outlines the deployment configuration for StudySmart AI.

## Architecture Overview
- **Frontend**: Vercel (React / Vite)
- **Backend**: Render (FastAPI / Uvicorn)
- **Database**: MongoDB Atlas
- **AI Integration**: Gemini API (Flash Lite)
- **File Storage**: Cloudinary

---

## 1. Required Environment Variables

### Frontend (Vercel)
*Define these in your Vercel project settings:*
- `VITE_API_URL` (e.g., `https://studysmart-backend.onrender.com`)

### Backend (Render)
*Define these in your Render Web Service settings:*
- `ENVIRONMENT` (set to `production`)
- `FRONTEND_URL` (e.g., `https://studysmart.vercel.app` - used for CORS)
- `MONGODB_URI`
- `DATABASE_NAME` (e.g., `studysmart_prod`)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (a verified Resend sender; use `onboarding@resend.dev` only for initial testing)
- `EMAIL_FROM_NAME` (e.g., `StudySmart AI`)

*(Note: Do not put real values in this document. Keep them secure in your hosting dashboard).*

---

## 2. MongoDB Atlas Setup
1. **Create Database**: Set up a free or shared cluster in MongoDB Atlas.
2. **Database User**: Create a user with read/write access and note the password.
3. **Network Access**: Under Network Access, allow access from anywhere (`0.0.0.0/0`) since Render IP addresses can change.
4. **Connection String**: Copy the connection string to use as your `MONGODB_URI` in Render.

---

## 3. Backend Deployment (Render)
1. Log in to Render and create a new **Web Service**.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Enter all the Backend environment variables listed above.
7. Deploy the service and copy the resulting `onrender.com` URL.

---

## 4. Frontend Deployment (Vercel)
1. Log in to Vercel and import your GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. **Framework Preset**: Vite (should be auto-detected).
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Add the `VITE_API_URL` environment variable, pasting the Render backend URL.
7. Deploy the project.
8. Set up any custom domains if required.

*(Note: Vercel inherently supports SPA routing for Vite out-of-the-box via `vercel.json` or automatic configuration).*

---

## 5. Post-Deployment Configuration & Smoke Test
Once both services are live, verify the integration:
- [ ] **CORS Verification**: Update `FRONTEND_URL` in Render to match your exact Vercel URL to avoid CORS errors.
- [ ] **Login / Signup**: Create an account to verify MongoDB connectivity and JWT generation.
- [ ] **Document Upload**: Upload a PDF to ensure Cloudinary integration and file size limits are working.
- [ ] **Study Mode Generation**: Generate notes to verify the Gemini API key is correct and limits are not being hit.
- [ ] **Question Mode**: Take a quick quiz.
- [ ] **History & Persistence**: Navigate away and return to History to ensure previous generations load correctly without triggering duplicate AI processing.

## 6. Security Checklist
- [ ] Ensure no API keys or `.env` files were accidentally committed to the GitHub repository.
- [ ] Ensure `.env.example` does not contain production secrets.
- [ ] Verify `VITE_API_URL` is the only environment variable exposed to the frontend browser context.
- [ ] Double-check that MongoDB network access restricts unnecessary connections if a dedicated IP architecture is used (or safely rely on strong passwords if `0.0.0.0/0` is used for Render).

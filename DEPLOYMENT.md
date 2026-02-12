
# Deployment Guide

This guide outlines the steps to deploy the backend to **Render** and the frontend to **Vercel**.

## 1. Backend Deployment (Render)

Render is an excellent choice for the backend as it simplifies deploying Node.js apps alongside PostgreSQL and Redis.

### Step 1: Create Database & Redis
1.  **Sign up/Login** to [Render](https://render.com).
2.  **Create PostgreSQL**:
    *   Click **New +** -> **PostgreSQL**.
    *   Name: `reachinbox-db`.
    *   Region: Closest to you (e.g., Singapore, Frankfurt).
    *   Plan: Free (or Starter).
    *   **Keep the Internal DB URL handy.**
3.  **Create Redis**:
    *   Click **New +** -> **Redis**.
    *   Name: `reachinbox-redis`.
    *   Region: Same as DB.
    *   Plan: Free.
    *   **Keep the Internal Redis URL/Host/Port handy.**

### Step 2: Deploy Web Service
1.  Click **New +** -> **Web Service**.
2.  Connect your GitHub repository.
3.  **Configuration**:
    *   **Name**: `reachinbox-backend`
    *   **Root Directory**: `backend`
    *   **Runtime**: Node
    *   **Build Command**: `npm install && npx prisma generate && npm run build`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    Add the following variables:
    *   `DATABASE_URL`: (Paste Internal DB URL from Step 1)
    *   `REDIS_HOST`: (Paste Redis Host)
    *   `REDIS_PORT`: (Paste Redis Port, usually 6379)
    *   `GOOGLE_CLIENT_ID`: (Your Google Client ID)
    *   `GOOGLE_CLIENT_SECRET`: (Your Google Client Secret)
    *   `SESSION_SECRET`: (Generate a random string)
    *   `WORKER_CONCURRENCY`: `5`
    *   `MAX_EMAILS_PER_HOUR`: `50`
    *   `MIN_DELAY_BETWEEN_EMAILS`: `2000`
5.  Click **Create Web Service**.

### Step 3: Run Migrations
Once the service is live (or even if it fails initially due to DB issues), you need to create the tables.
1.  Go to the **Shell** tab in your Render dashboard for the web service.
2.  Run: `npx prisma migrate deploy`
3.  This will create the necessary tables in your production database.

---

## 2. Frontend Deployment (Vercel)

### Step 1: Import Project
1.  **Sign up/Login** to [Vercel](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.

### Step 2: Configure
1.  **Root Directory**: Click "Edit" and select `frontend`.
2.  **Framework Preset**: It should auto-detect **Vite**.
3.  **Build Command**: `npm run build` (Default).
4.  **Output Directory**: `dist` (Default).

### Step 3: Environment Variables
1.  Expand **Environment Variables**.
2.  Add:
    *   **Key**: `VITE_API_URL`
    *   **Value**: The URL of your deployed Render backend (e.g., `https://reachinbox-backend.onrender.com`).
    *   *Note: Do NOT include a trailing slash.*

### Step 4: Deploy
1.  Click **Deploy**.
2.  Wait for the build to finish. You should see your live app shortly!

---

## 3. Post-Deployment (Critical)

### Google OAuth Configuration
2.  Go to [Google Cloud Console](https://console.cloud.google.com/).
3.  Navigate to **APIs & Services** -> **Credentials**.
4.  Edit your OAuth 2.0 Client ID.
5.  **Authorized JavaScript Origins**: Add your Vercel domain (e.g., `https://reachinbox-frontend.vercel.app`).
6.  **Authorized Redirect URIs**: Add your Render backend callback URL (e.g., `https://reachinbox-backend.onrender.com/auth/google/callback`).
7.  Save changes.

**Done!** Your full-stack scheduler is now live. 🚀

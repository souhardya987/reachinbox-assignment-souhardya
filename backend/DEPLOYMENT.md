# Deploying ReachInbox Backend to Render

You can deploy the backend using **Render Blueprints** (Easiest) or **Manually**.

## Option 1: Using Render Blueprint (Recommended)

1.  Push your latest code to GitHub/GitLab.
2.  Go to the [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Blueprint**.
4.  Connect your repository `reachinbox-assignment`.
5.  Rentder will detect `render.yaml` and show you the resources to be created:
    -   `reachinbox-backend` (Web Service)
    -   `reachinbox-db` (PostgreSQL)
    -   `reachinbox-redis` (Redis)
6.  Click **Apply**.
7.  **IMPORTANT:** Once created, go to the `reachinbox-backend` service -> **Environment** and add the following secrets manually:
    -   `GOOGLE_CLIENT_ID`
    -   `GOOGLE_CLIENT_SECRET`
    -   `FRONTEND_URL` (Your deployed frontend URL, e.g., `https://your-frontend.onrender.com`)

## Option 2: Manual Setup (If you prefer)

### 1. Set up PostgreSQL Database
1.  Go to Render Dashboard -> **New +** -> **PostgreSQL**.
2.  Name: `reachinbox-db`
3.  Region: Pick the one closest to you (e.g., Singapore).
4.  Plan: **Free** (or Starter).
5.  Click **Create Database**.
6.  Once created, copy the **Internal Database URL** (e.g., `postgres://user:password@host/db`).

### 2. Set up Redis
1.  Go to Render Dashboard -> **New +** -> **Redis**.
2.  Name: `reachinbox-redis`
3.  Region: Same as Database.
4.  Plan: **Free**.
5.  Click **Create Redis**.
6.  Copy the **Internal Redis URL** (e.g., `redis://host:port`).

### 3. Deploy Backend Service
1.  Go to Render Dashboard -> **New +** -> **Web Service**.
2.  Connect your repository.
3.  Name: `reachinbox-backend`
4.  Runtime: **Node**
5.  Build Command: `npm install && npm run build`
6.  Start Command: `npm start`
7.  **Environment Variables** (Add these):
    -   `DATABASE_URL`: (Paste Internal Database URL from Step 1)
    -   `REDIS_URL`: (Paste Internal Redis URL from Step 2)
    -   `NODE_ENV`: `production`
    -   `SESSION_SECRET`: (Generate a random string)
    -   `JWT_SECRET`: (Generate a random string)
    -   `GOOGLE_CLIENT_ID`: (From Google Cloud Console)
    -   `GOOGLE_CLIENT_SECRET`: (From Google Cloud Console)
    -   `FRONTEND_URL`: (Your frontend URL)

## Final Steps
-   Wait for the deployment to finish.
-   Check the logs to ensure the server started successfully.
-   The API will be available at `https://reachinbox-backend.onrender.com`.

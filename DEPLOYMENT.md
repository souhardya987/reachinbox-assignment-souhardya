# Deployment Guide

You have chosen to deploy the **Backend** and **Frontend** separately.

---

## Part 1: Deploy Backend (Web Service + DB + Redis)

We will use the `render.yaml` file to deploy the backend infrastructure efficiently.

1.  **Push** your code to GitHub/GitLab.
2.  Go to the [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Blueprint**.
4.  Connect your repository.
5.  Render will verify the `render.yaml` and detecting:
    -   `reachinbox-backend`
    -   `reachinbox-db` (PostgreSQL)
    -   `reachinbox-redis`
6.  Click **Apply**.
7.  **Wait** for the deployment to finish.

### ⚠️ Important: Backend Environment Variables
Once deployed, go to **Dashboard** -> **reachinbox-backend** -> **Environment** and add the following missing secrets:
-   `GOOGLE_CLIENT_ID`: (Your Google Client ID)
-   `GOOGLE_CLIENT_SECRET`: (Your Google Client Secret)
-   `FRONTEND_URL`: (You will get this URL *after* deploying the frontend in Part 2)

**Copy the Backend URL**:
Once the backend is live, copy its URL (e.g., `https://reachinbox-backend.onrender.com`). You will need this for the frontend.

---

## Part 2: Deploy Frontend

You can deploy the frontend as a **Static Site** on Render (or Vercel/Netlify).

### Option A: Deploy on Render (Static Site)
1.  Go to Render Dashboard -> **New +** -> **Static Site**.
2.  Connect your repository.
3.  **Name**: `reachinbox-frontend`
4.  **Root Directory**: `frontend` (Important!)
5.  **Build Command**: `npm install && npm run build`
6.  **Publish Directory**: `dist`
7.  **Environment Variables**:
    -   Key: `VITE_API_URL`
    -   Value: (Paste the Backend URL from Part 1, e.g., `https://reachinbox-backend.onrender.com`)
8.  Click **Create Static Site**.

### Option B: Deploy on Vercel (Easier for React)
1.  Go to Vercel -> **Add New Project**.
2.  Import your repository.
3.  **Framework Preset**: Vite
4.  **Root Directory**: Edit and select `frontend`.
5.  **Environment Variables**:
    -   `VITE_API_URL`: (Paste the Backend URL from Part 1)
6.  Click **Deploy**.

---

## Part 3: Connect Them

1.  Take the **Frontend URL** (e.g., `https://reachinbox-frontend.onrender.com`).
2.  Go back to your **Backend Service** on Render.
3.  Update the `FRONTEND_URL` environment variable with this new value.
4.  **Save** (This will trigger a quick backend redeploy).

**Done!** Your backend and frontend are now deployed separately and connected.

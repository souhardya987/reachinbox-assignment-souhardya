
# ReachInbox Assignment - Email Scheduler

This project is a full-stack email scheduling application built with the PERN stack (PostgreSQL, Express, React, Node.js), TypeScript, and BullMQ for robust job scheduling.

## Features

### Backend
-   **Robust Scheduling**: Uses **BullMQ** (Redis-based) to schedule emails without relying on cron jobs.
-   **Persistence**: Emails are stored in **PostgreSQL** and the queue is persisted in **Redis**. The system recovers gracefully from restarts, ensuring no lost jobs.
-   **Concurrency Control**: Configurable worker concurrency to handle multiple jobs in parallel.
-   **Smart Rate Limiting**: Implements a dual-constraint limiter:
    -   Global hourly rate limit (e.g., 50 emails/hour).
    -   Minimum delay between emails (throttling) to prevent bursting.
-   **Idempotency**: Prevents duplicate sends by checking the email status in the database before processing.
-   **Real-time Stats**: Provides endpoints for live counts of scheduled and sent emails.

### Frontend
-   **Modern UI**: Built with **React**, **Tailwind CSS**, and **Lucide Icons**, matching the provided Figma design.
-   **Dashboard**:
    -   **Sidebar**: Displays real-time counts of Scheduled and Sent emails.
    -   **Search**: Functional search bar filters email lists instantly.
-   **Email Lists**:
    -   **Scheduled**: Tabular view with status indicators.
    -   **Sent**: List view with delete functionality.
-   **Delete Action**: Users can delete sent emails, which updates the UI and database immediately.

---

## Setup Instructions

### Prerequisites
-   Node.js (v16+)
-   PostgreSQL (Running locally or via Docker)
-   Redis (Running locally on default port 6379)

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    Create a `.env` file in `backend/` with the following:
    ```env
    PORT=3000
    DATABASE_URL="postgresql://user:password@localhost:5432/reachinbox?schema=public"
    REDIS_HOST="127.0.0.1"
    REDIS_PORT=6379
    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    SESSION_SECRET="supersecret"
    
    # Scheduler Configuration
    WORKER_CONCURRENCY=5
    MAX_EMAILS_PER_HOUR=50
    MIN_DELAY_BETWEEN_EMAILS=2000
    ```
4.  Generate Prisma Client:
    ```bash
    npx prisma generate
    ```
5.  Start the Server (and Worker):
    ```bash
    npm run dev
    ```
    *The server will start on port 3000 and the worker will begin listening for jobs.*

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Development Server:
    ```bash
    npm run dev
    ```
    *The frontend will run on http://localhost:5173.*

---

## Architecture Overview

### Scheduling & Persistence
-   **Flow**: When a user schedules an email, it is saved to PostgreSQL with status `PENDING` and added to a BullMQ delay queue in Redis.
-   **No Cron**: We do not use cron jobs. BullMQ handles the timing using Redis keys.
-   **Restarts**: 
    -   Redis persists the job queue.
    -   PostgreSQL persists the email metadata.
    -   On restart, the worker reconnects to Redis and resumes processing any due jobs.

### Rate Limiting & Concurrency
-   **Configuration**: We define `MAX_EMAILS_PER_HOUR` and `MIN_DELAY_BETWEEN_EMAILS`.
-   **Loop Logic**: The worker calculates a `finalDelayPerEmail` which is the maximum of:
    1.  The necessary spacing to enable the hourly rate (e.g., 3600s / 50 emails = 72s).
    2.  The explicit minimum delay (e.g., 2s).
-   **BullMQ Limiter**: We pass this calculated duration to the BullMQ Worker's `limiter` option (`max: 1, duration: finalDelayPerEmail`). This ensures the worker processes only one job every `X` milliseconds, strictly adhering to the limits.
-   **Concurrency**: The `concurrency` option allows the worker to pick up multiple jobs if the limiter permits, but the rate limiter serves as the primary governor.

---

## Testing & Verification

-   **Mock Email**: We use **Ethereal Email** to simulate sending. Credentials are auto-generated if not provided.
-   **Verification Steps**:
    1.  **Schedule**: Send a POST request to `/api/schedule-email` or use the frontend.
    2.  **Observe**: Check the console logs for "Processing job..." and "Calculated Limiter...".
    3.  **Restart**: Stop the backend `npm run dev` and start it again. Scheduled emails will still send.
    4.  **Delete**: Click the trash icon on a sent email in the frontend to verify deletion.

## Assumptions & Trade-offs
-   **Global Rate Limit**: The current rate limit implementation is global for the worker instance. Per-user rate limiting would require dynamic queue names or key-based limiting in Redis.
-   **Single Worker Instance**: The architecture supports horizontal scaling, but for this assignment, we assume a single worker instance.
-   **Ethereal**: Used for demonstration; in production, this would be replaced by SendGrid/SES.

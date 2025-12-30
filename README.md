# Pastebin App

A modern, secure, and ephemeral pastebin application built with Next.js 15.

## Features

- **Create Pastes**: Securely store text snippets.
- **Expiration (TTL)**: Set pastes to expire after a specific duration (1 minute to 1 week).
- **Burn After Reading**: Set a maximum view limit (e.g., deleted after 1 view).
- **Secure IDs**: Uses URL-friendly unique IDs.
- **REST API**: Full programmatic access via API.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Persistence**: MongoDB (via Mongoose).
- **Deployment**: Optimized for Vercel/Railway/Render.

## Persistence Layer

We use **MongoDB** for storage.
- **Config**: Configured in `.env.local` via `MONGODB_URI`.
- **Data Model**: `lib/models/Paste.ts`
  - Collection: `pastes`
  - Fields: `id`, `content`, `createdAt`, `expiresAt`, `remainingViews`.

## Design Decisions

1.  **Persistence**: Switched to MongoDB for robust document storage.
2.  **Burn Logic**: Implemented at the application level (API & Page logic).
3.  **Security**: 
    - Content served safe (via `<pre>` tag escaping) to prevent XSS.
    - IDs are non-sequential.

## How to Run Locally

1.  **Clone & Install**
    ```bash
    git clone <repo>
    cd pastebin-app
    npm install
    ```

2.  **Environment Setup**
    Copy default env vars:
    ```bash
    cp .env.example .env.local
    ```
    Update `.env.local` with your MongoDB connection string:
    ```env
    MONGODB_URI="mongodb://localhost:27017/pastebin-lite"
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` (or `3001` if 3000 is in use).

## API Endpoints

- `POST /api/pastes`: Create a paste.
- `GET /api/pastes/:id`: Retrieve raw paste data (JSON).
- `GET /api/healthz`: Health check.

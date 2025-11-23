# Personal Life Manager - Backend

This is the backend service for the Personal Life Manager application. It provides a RESTful API for managing personal memories, generating daily plans using AI, and tracking progress across different life modules (University, Fitness, Work, Life).

## Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL (Relational Data), Qdrant (Vector Data for Semantic Search)
*   **ORM**: Prisma
*   **AI**: Google Gemini (Generative AI & Embeddings)
*   **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

*   Node.js (v16+)
*   PostgreSQL installed and running
*   Qdrant instance (Local or Cloud)
*   Google Cloud Project with Gemini API access

## Installation & Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the `backend` root with the following variables:
    ```env
    PORT=3000
    DATABASE_URL="postgresql://user:password@localhost:5432/life_manager?schema=public"
    QDRANT_URL="http://localhost:6333"
    GEMINI_API_KEY="your_gemini_api_key"
    JWT_SECRET="your_jwt_secret_key"
    ```

4.  **Database Setup:**
    Push the Prisma schema to your PostgreSQL database:
    ```bash
    npx prisma db push
    ```

5.  **Run the Server:**
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000` (or your specified PORT).

## Authentication

Authentication is fully implemented using JWT.
- To bypass Auth (dev only): set `BYPASS_AUTH=true` in `.env`.
- Default: Auth is ENABLED.

## API Documentation

All API routes are prefixed with `/api/v1`.

### 1. Authentication (`/api/v1/auth`)

*   **POST** `/register`
    *   **Description**: Register a new user.
    *   **Body**: `{ "email": "user@example.com", "password": "password123", "name": "John Doe" }`
    *   **Response**: Returns a JWT token and user info.

*   **POST** `/login`
    *   **Description**: Login an existing user.
    *   **Body**: `{ "email": "user@example.com", "password": "password123" }`
    *   **Response**: Returns a JWT token and user info.

*   **GET** `/me`
    *   **Description**: Get current authenticated user's profile.
    *   **Headers**: `x-auth-token: <token>`

### 2. Dashboard (`/api/v1/dashboard`)

*   **GET** `/`
    *   **Description**: Fetch the main dashboard summary (Today's plan, next task, overview stats).
    *   **Response**: `{ "date": "...", "dailyPlan": [...], "nextTask": {...}, "overview": {...} }`

*   **GET** `/stats/:module`
    *   **Description**: Get statistics for a specific module (UNI, FITNESS, WORK, LIFE).
    *   **Params**: `module` (e.g., `UNI`)
    *   **Response**: Upcoming deadlines and recent logs for that module.

### 3. User Management (`/api/v1/user`)

*   **GET** `/profile`
    *   **Description**: Get full user profile details.
    *   **Response**: User object including preferences.

*   **PUT** `/preferences`
    *   **Description**: Update user onboarding preferences.
    *   **Body**: `{ "preferences": { "focusAreas": [...], "workHours": "..." } }`

### 4. Memories (`/api/v1/memories`)

*   **POST** `/`
    *   **Description**: Create a new memory (Log, Task, Event, Note).
    *   **Body**:
        ```json
        {
          "module": "UNI",
          "type": "TASK",
          "text": "Finish Physics assignment",
          "importance": 3,
          "eventDate": "2023-10-27T10:00:00Z" // Optional, for tasks/events
        }
        ```

*   **GET** `/`
    *   **Description**: Get recent memories.
    *   **Query Params**: `module` (optional), `limit` (default 10).

*   **POST** `/search`
    *   **Description**: Semantic search over memories using Qdrant vector search.
    *   **Body**: `{ "query": "What did I study last week?", "module": "UNI" }`

### 5. Planner (`/api/v1/planner`)

*   **POST** `/`
    *   **Description**: Generate a daily schedule based on recent context and user intent.
    *   **Body**: `{ "date": "2023-10-27", "user_intent": "Focus on studying and get a workout in." }`
    *   **Response**: AI-generated schedule JSON.

## Project Structure

```
backend/
├── prisma/              # Database schema
├── src/
│   ├── config/          # DB & External Service Configs
│   ├── controllers/     # Request Handlers
│   ├── middlewares/     # Auth & Error Middleware
│   ├── routes/          # API Route Definitions
│   ├── services/        # Business Logic (AI, DB, Vector)
│   └── prompts/         # AI Prompt Templates
└── index.js             # Entry point
```

## Key Features

*   **Vector Search**: Memories are embedded using Gemini and stored in Qdrant for semantic retrieval.
*   **AI Planning**: Generates schedules by analyzing recent logs, deadlines, and user intent.
*   **Module-Based Organization**: Data is segmented by life areas (University, Fitness, Work, Life).


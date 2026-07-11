# EventBudget

Multi-tenant event budgeting platform with an AI assistant powered by Gemini.

## Structure

```
/
  api/    — NestJS + Prisma + MySQL backend
  web/    — React + TypeScript frontend
```

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL running locally
- Gemini API key (https://aistudio.google.com/apikey)

### 1. Backend

```bash
cd api
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npx prisma migrate dev
npm run start:dev
```

API available at `http://localhost:3000/api`

### 2. Frontend

```bash
cd web
npm install
# create .env with: VITE_API_URL=http://localhost:3000/api
npm run dev
```

App available at `http://localhost:5173`

## Features

- **Multi-tenant** — each user belongs to a workspace; all data is strictly scoped
- **JWT auth** — every request authenticated; workspace validated via `x-workspace-id` header
- **Events CRUD** — create events with title, date, currency; GET returns computed budget summary
- **Budget Items CRUD** — per-event line items with category, description, amount
- **AI Budget Assistant** — chat with Gemini to generate a budget proposal; proposal is saved as pending and must be approved before any items are written
- **Real-time** — approving a proposal emits `budget:updated` via Socket.IO to all clients in the same workspace; budget table refreshes without page reload

## Postman Collection

Import `EventBudget.postman_collection.json` from the root of this repo.

Run **Login** first — it auto-saves `token` and `workspaceId` to collection variables used by all other requests.

## Tests

```bash
cd api
npm run test
```

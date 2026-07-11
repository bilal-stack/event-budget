# EventBudget — API

NestJS + Prisma + MySQL backend for the multi-tenant event budgeting platform.

## Stack

- **NestJS** — feature module architecture, global JWT + workspace guards
- **Prisma 6** — ORM with MySQL
- **Socket.IO** — real-time budget updates per workspace
- **Gemini API** — AI budget proposal generation (`@google/generative-ai`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="mysql://root:@localhost:3306/event_budgeting"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
GEMINI_API_KEY="your-gemini-api-key"
```

Get a Gemini API key at https://aistudio.google.com/apikey

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Start the server

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server runs on `http://localhost:3000`

## API Overview

All endpoints (except auth) require:
- `Authorization: Bearer <token>` header
- `x-workspace-id: <workspaceId>` header

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register + create workspace |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/events | List workspace events |
| POST | /api/events | Create event |
| GET | /api/events/:id | Get event + budget summary |
| PATCH | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |
| GET | /api/events/:id/budget-items | List budget items |
| POST | /api/events/:id/budget-items | Add budget item |
| PATCH | /api/events/:id/budget-items/:itemId | Update budget item |
| DELETE | /api/events/:id/budget-items/:itemId | Delete budget item |
| POST | /api/events/:id/ai/chat | Generate AI proposal |
| GET | /api/events/:id/ai/proposal | Get pending proposal |
| POST | /api/events/:id/ai/approve | Approve proposal → writes budget items |
| POST | /api/events/:id/ai/reject | Reject proposal |

## Real-Time (Socket.IO)

Connect to `ws://localhost:3000` with query param `?token=<jwt>`.

The server joins the client to their workspace room. On proposal approval, `budget:updated` is emitted to all clients in the same workspace:

```json
{ "eventId": "..." }
```

## Tests

```bash
npm run test
```

Covers: AI currency validation, pending proposal blocking, approve transaction, budget summary computation, workspace 404 scoping.

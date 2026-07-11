# EventBudget — Web

React + TypeScript frontend for the multi-tenant event budgeting platform.

## Stack

- **React 18** + **TypeScript** — Vite
- **TanStack Query v5** — all server state
- **React Router v6** — client-side routing
- **Tailwind CSS v4** — styling
- **Socket.IO client** — real-time budget updates
- **Axios** — HTTP client with JWT + workspace interceptors

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

Make sure the API server is running first.

### 3. Start the dev server

```bash
npm run dev
```

App runs on `http://localhost:5173`

## Screens

### Login / Register
- Tab-switched form — register creates a workspace automatically
- JWT and workspaceId stored in localStorage on login
- Redirects to dashboard on success

### Events List (`/`)
- Table of all workspace events with total budget per event
- Create new event (title, date, currency)
- Click any row to open event detail
- Delete event

### Event Detail (`/events/:id`)
- Budget summary cards — total spend + per-category breakdown
- Budget items table — add, inline edit, delete
- **AI Budget Assistant** chat panel:
  - Type a message describing your needs
  - Gemini generates a proposal shown as a card with line items
  - Approve → items written to budget, table refreshes instantly via Socket.IO
  - Reject → proposal dismissed, new one can be requested
  - Pending proposals persist across page reloads

## Build

```bash
npm run build
```

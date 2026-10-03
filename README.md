# Labora

Labora is a virtual science laboratory with nine guided experiments, quizzes, progress tracking, and teacher assignments.

## Project structure

- `frontend/` — Next.js modular monolith, feature-owned simulation engines, and `public/` assets.
- `backend/` — Supabase database schema and setup guidance. Supabase hosts authentication and shared data; no separate Node server is required.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Landing-page app entry buttons open `/dashboard`. Login and signup remain available; use the student or teacher demo option on `/login` without Supabase. Demo data remains in this browser.

See [ARCHITECTURE.md](ARCHITECTURE.md) for module ownership, public APIs, SOLID contracts, and dependency rules.

## Shared school data

Follow [`backend/README.md`](backend/README.md) to connect Supabase. Credentials go in `frontend/.env.local`.

## Checks

```bash
cd frontend
npm run check
npm test
npm run test:ui
npm run build
```

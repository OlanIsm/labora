# Labora

Labora is a virtual science laboratory with nine guided experiments, quizzes, progress tracking, and teacher assignments.

## Project structure

- `frontend/` — Next.js app, simulation engine, and `public/` for future images and other assets.
- `backend/` — Supabase database schema and setup guidance. Supabase hosts authentication and shared data; no separate Node server is required.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The public landing page leads to login or signup. Use the student or teacher demo option on `/login` to enter the app without Supabase. Demo data remains in this browser.

## Shared school data

Follow [`backend/README.md`](backend/README.md) to connect Supabase. Credentials go in `frontend/.env.local`.

## Checks

```bash
cd frontend
npm test
npm run build
```

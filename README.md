# Labora

Labora is a virtual science laboratory with nine guided experiments, quizzes, progress tracking, and teacher assignments.

## Project structure

- `frontend/` — Next.js modular monolith, feature-owned simulation engines, and `public/` assets.
- `backend/` — server modules for authentication, classrooms, versioned experiments, sessions, assessment, assignments, notes and notifications; Supabase migrations and setup guidance.
- `shared/` — typed API contracts and the pure guided experiment engine. The same Next.js deployment hosts the API.

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

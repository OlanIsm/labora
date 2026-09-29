# Labora

A browser-based virtual science laboratory with nine guided experiments, draggable tools, scientific visualizations, quizzes, progress, and teacher assignments.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use **Continue as student** or **Continue as teacher** on `/login` to explore without a backend. Demo data is saved in the browser.

## Shared school data

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. Copy `.env.example` to `.env.local` and enter the project URL and anon key.
3. Restart the app. Sign up with a matching class or group name to share assignments and results.

The local demo mode remains available without Supabase. Supabase authentication and row policies handle shared data when configured.

## Checks

```bash
npm test
npm run build
```

Experiment definitions and questions live in `lib/data.ts`; action validation is in `lib/engine.ts`; scientific calculations are in `lib/science.ts`.

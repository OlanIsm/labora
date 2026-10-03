# Labora architecture

Labora is a modular monolith: one Next.js application, one deployment, and one Supabase database. Features communicate through explicit TypeScript entry points within the same process. Demo mode uses browser persistence. The refactor retains URLs, saved object IDs, localStorage keys, the database schema, and the visual design.

## Structure

```text
frontend/
  app/                 Next.js entry point, metadata, global styles
  application/         Route composition, application state, dependency wiring
  features/
    auth/              Session, authentication, profile persistence
    assignments/       Teacher builder, assignment storage, assessment views
    dashboard/         Student dashboard composition
    experiments/       Guided definitions, step engine, runtime, lab UI
    laboratory/        Free experiment workbench and scientific simulations
      domain/          Bench state, actions, catalog and engine
      application/     Bench lifecycle and autosave
      infrastructure/  Bench persistence and file export
      ui/              Inventory, workspace, observations, category selection
      subjects/        Chemistry, physics and biology implementations
    marketing/         Public landing page
    progress/          Results, scores and learning history
    settings/          Account settings UI
  shared/              Brand assets, subject identity, common UI and infrastructure
  tests/               Integration, domain, UI and browser regressions
  scripts/             Automated architecture checks
backend/
  schema.sql           Supabase tables and access policies
```

Chemistry, physics and biology are subdomains of the laboratory module: they share bench entities, quantities and cross-subject experiments. The existing equations and state transitions remain separate from React rendering. The five physics simulations keep their own pure engines; React animation loops and coaching hooks live under `application/`, and browser audio under `infrastructure/`.

## Module boundaries

| Entry point | Purpose |
| --- | --- |
| `features/<module>/index.ts` | Services and domain operations used by other modules |
| `features/<module>/model.ts` | Public data types and contracts, imported with `import type` |
| `features/<module>/ui.ts` | Components exposed to application composition |
| `features/<module>/routes.ts` | Public feature URL helpers where needed |

Only expose symbols that have callers. Internal files can import other files within their own module. Other modules use the public entry points. Tests may inspect internals to verify scientific behavior.

- `app/` mounts the application and imports styles.
- `application/` selects pages and wires concrete repositories into state orchestration and UI.
- Features do not import `application/` or `app/`.
- `shared/` does not import features.
- Domain engines do not import React, Next.js, Supabase, UI, or infrastructure.
- Runtime dependencies between modules must be acyclic. Type contracts can refer to another module's public model.

`npm run check:architecture` enforces these rules against static imports, re-exports and dynamic imports. It also detects runtime cycles between features. Feature styles are loaded by the Next.js root layout; this CSS composition is outside the TypeScript API boundary.

## SOLID in practice

- **Single responsibility:** page rendering, step calculations, routing and persistence live in separate files. The guided experiment hook manages its runtime; its component manages the view and drag/drop affordances.
- **Open/closed:** experiment definitions extend the existing step engine; physics simulations register in the simulation catalog. New subjects can add scientific implementations within the laboratory module.
- **Liskov substitution:** `SessionRepository`, `AssignmentRepository`, `ProgressRepository` and `RuntimeRepository` define behavior independent of Supabase. Implementations or test doubles follow the same contracts.
- **Interface segregation:** login receives `AuthGateway`; dashboard receives only runtime reading; guided experiments receive runtime persistence. Screens do not receive the entire application service registry.
- **Dependency inversion:** `useApplicationState` receives `ApplicationServices`; authentication and runtime UI receive narrow ports. The composition layer chooses the browser/Supabase implementations.

## Persistence and failures

Each feature owns its storage operations and database table access. The shared browser adapter only reads, writes and removes JSON; it contains no assignment, session or scoring logic. Supabase configuration stays in shared infrastructure.

Demo profiles never sync school data. Assignment publication waits for cloud persistence before saving locally. Completed experiment results save locally first; failed synchronization reports that the local result is available. Blocked or malformed browser storage returns the same safe fallbacks used by demo mode. Existing bench persistence retains its in-memory fallback and versioned validation.

## Maintenance checks

```bash
cd frontend
npm run check
npm test
npm run test:ui
npm run build
```

Use `npm run format` to apply the committed Prettier configuration. `npm run test:browser` checks the app shell, guided completion, free labs, student/teacher demo authentication and assignment publication against a running application. Set `LABORA_BASE_URL` and install/provide Playwright through `LABORA_PLAYWRIGHT` if it is not available locally.

For concurrent development or validation servers, set `LABORA_DIST_DIR` to a separate `.next-*` directory before starting or building Next.js. This keeps generated manifests isolated. The default development output remains `.next`.

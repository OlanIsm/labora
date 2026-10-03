# Labora backend

Implementation is phased. See [the implementation plan](IMPLEMENTATION_PLAN.md) for schema, frontend migration, error contract, V1/V2 scope and current status.

## Backend modules

- `modules/identity/`: verified cookie authentication, recovery, profile and private avatar upload.
- `modules/classrooms/`: school workspaces, database-backed roles, classes and expiring invitations.
- `modules/catalog/`: nine versioned experiment definitions; answer keys stay in the private schema.
- `modules/sessions/`: pinned guided runtimes, sandbox snapshots, idempotent events and optimistic revisions.
- `modules/assessment/`: server grading, immutable submissions and authorized result history.
- `modules/assignments/`: drafts, atomic publication, frozen recipients and paginated teacher reports.
- `modules/notes/` and `modules/notifications/`: owned notebook entries and persistent notification state.
- `shared/`: safe errors, HTTP validation, environment configuration and cookie-based Supabase client.
- HTTP adapters live under `frontend/app/api/v1/`; browser features use the shared API transport.
- Shared DTOs live in `shared/contracts/` at the repository root, accessed through path aliases. One Next.js deployment; no packages monorepo.

## Configuration

Copy `frontend/.env.example` to `frontend/.env.local` and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` and the canonical `APP_URL`. All four are server environment variables. Never prefix the secret key with `NEXT_PUBLIC_`. Legacy anon/service-role keys are supported for local CLI compatibility. In production enable email confirmation and configure SMTP, the site URL, and the exact confirmation/recovery callback URLs in Supabase Auth. Recovery callbacks must retain `?recovery=1`.

`APP_URL=http://localhost:3000` is for local development. Set it to the actual HTTPS deployment domain when hosting the application; no public deployment URL has been provisioned yet. Mutations enforce this origin. Vercel uses its overwritten client-IP header automatically. Other reverse proxies must overwrite `X-Real-IP` before setting `TRUST_PROXY=1`. Without a trusted ingress, unauthenticated requests share an ingress rate quota. Auth and API quotas are persisted in Postgres, not process memory.

Without configuration, `/api/v1/auth/config` reports `configured: false`; explicit local demo remains available. Real authenticated API operations return `NOT_CONFIGURED` rather than creating a pretend school account.

## Database installation

The installation source is `supabase/migrations/`, generated and verified with Supabase CLI 2.119.0 against PostgreSQL 17. Five migrations install the schema/RLS/RPC grants, private avatar storage, the nine experiments and private grading keys, teacher report aggregation and complete student progress summaries. `supabase/seed.sql` repeats the catalog insertion idempotently for local resets. Never modify published version rows; future content changes require a new version and migration.

The old `schema.sql` is a legacy reference, not an installation script. The first migration deliberately refuses existing legacy assignment/result tables. Before remote installation inventory tables, policies, Auth users, migration history and PostgreSQL version. If legacy tables exist, export and verify them, review a conversion into the new tables, and retain unverified client grades as legacy records rather than authoritative assessments. No remote conversion or migration has been performed yet.

From `backend/`, with Docker running:

```sh
npx --yes supabase@2.119.0 start
npx --yes supabase@2.119.0 db reset --local --yes
npx --yes supabase@2.119.0 db advisors --local
npx --yes supabase@2.119.0 migration list --local
```

Reset is only for the disposable local database. Production changes use reviewed migration deployment after a backup and compatibility check, never reset. Deploy Next.js with `frontend/` as the application root and the parent repository available for backend/shared imports. The frontend API adapters and backend run in the same Node deployment.

## Authorization and persistence

Membership rows determine roles; editable Auth metadata never grants privileges. Browser Data API grants allow scoped reads and limited profile/read-state updates. Assessment, roles, publication and answer-key RPCs are service-only. Every public table has RLS; private keys are neither exposed through PostgREST nor imported into browser code. Uploaded avatars are private and signed only for their owning profile.

Guided actions/answers update canonical state transactionally. UUID events support retry, revision conflicts return 409, and submission produces one immutable result per attempt. Students can create another attempt; published assignments currently allow unlimited retakes until their due date. Teacher completion counts use distinct recipients and scores use the best submitted attempt. Report totals cover the complete dataset while rows are paginated.

Sandbox configurations autosave every five seconds. Only meaningful controls/configuration are saved, not animation frames. Device drafts are namespaced by user UUID; network failure preserves them, and concurrent-device conflicts require loading the account version before explicitly recovering a device draft. Chemistry notebook entries save through the owned note API with idempotent UUIDs, restore from the account and export text. Bench snapshots retain their original note records for compatibility. Teacher CSV export fetches all report pages and escapes spreadsheet formulas in authored text.

## Verification

From `frontend/`:

```sh
npm run check
npm run test:api
npm test
npm run test:ui
npm run build
```

Playwright is pinned as a development dependency. Run `npx playwright install chromium` once, then set `LABORA_BASE_URL` for browser checks. `LABORA_PLAYWRIGHT` is only needed for an external Playwright installation. The demo suites run independently from actual-account tests. The API-auth browser foundation suite expects an unconfigured server. For local integration, set the local CLI API URL, anon key and service-role key in the process environment, then run from `frontend/`:

```sh
npx tsx tests/backend-integration.test.ts
node tests/account-flow.browser.cjs
```

These fixtures refuse remote Supabase hosts. Integration checks cover nine assessed experiments, enrollment, private answer keys, real cookie authentication, duplicate/stale events, score tampering, assigned teacher access, snapshots, notes, private avatar upload and direct Data API isolation. The browser account suite uses two independent contexts to verify guided resume and persisted server scores. These checks do not certify the remote project.

GitHub Actions runs the production build, architecture/types/format checks, domain/API/UI suites and the production dependency audit on pushes and pull requests. Database and browser integration still require the disposable local Supabase environment; they are not executed by that workflow. The extended browser export/notebook checks require a final rerun: this session's automatic approval review rejected starting a local production test server, including a loopback-only attempt.

## Release status and recovery

Local schema reset, advisors, integration, domain/API/UI checks and the production build have passed. Production dependency audit reports zero vulnerabilities. Release remains pending remote project inventory/access, real server credentials, Auth/SMTP/domain configuration, staging verification and reviewed migration deployment. Individual recipient targeting remains outside the currently implemented class publication flow; live legacy-data conversion depends on inventory. See the plan for scope and remaining gates.

Before deployment take a verified database backup, retain prior application build and record applied migrations. Database versions/results are immutable: rollback application code against compatible contracts, or apply a forward correction migration. Do not drop assessed history to fix deployment. Avatar cleanup failures are logged for storage maintenance. Rotate a leaked server key in Supabase and update server configuration; request IDs permit safe API error correlation without logging credentials or student answers.

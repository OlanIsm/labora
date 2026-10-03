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

Copy `frontend/.env.example` to `frontend/.env.local` and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` and the canonical `APP_URL`. `SUPABASE_URL` must be the project origin, such as `https://your-project.supabase.co`, without `/rest/v1/`. All four are server environment variables. Never prefix the secret key with `NEXT_PUBLIC_`. Legacy anon/service-role keys are supported for local CLI compatibility. In production enable email confirmation and configure SMTP, the site URL, and the exact confirmation/recovery callback URLs in Supabase Auth. Recovery callbacks must retain `?recovery=1`.

The production application is `https://labora-mu.vercel.app`. Set `APP_URL=https://labora-mu.vercel.app` in the Vercel production environment and redeploy after changing it. Leave `APP_URL` empty locally to use the request URL, or set it to the local server origin. Never copy a localhost value into production. Mutations enforce this origin. Vercel uses its overwritten client-IP header automatically. Other reverse proxies must overwrite `X-Real-IP` before setting `TRUST_PROXY=1`. Without a trusted ingress, unauthenticated requests share an ingress rate quota. Auth and API quotas are persisted in Postgres, not process memory.

In [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/cidyenmlvuqciymnqzii/auth/url-configuration), set **Site URL** to `https://labora-mu.vercel.app` and add these exact **Redirect URLs**:

- `https://labora-mu.vercel.app/api/v1/auth/confirm`
- `https://labora-mu.vercel.app/api/v1/auth/confirm?recovery=1`

Keep local callback URLs in the allow list only if local account testing is needed. The standard confirmation email template should use `{{ .ConfirmationURL }}` so Supabase verifies the email and forwards the PKCE code to the callback. Custom token-hash links must use `{{ .RedirectTo }}` as their base, with `token_hash={{ .TokenHash }}` and `type=signup` (or `type=recovery` for password reset). Do not hardcode localhost or use the site root as the confirmation callback. Changing a local `config.toml` does not update hosted Auth configuration. Check [Supabase's redirect guide](https://supabase.com/docs/guides/auth/redirect-urls) when changing domains. A callback missing from the allow list can fall back to the Site URL; leaving that default on localhost sends production users to their own computer.

Without configuration, `/api/v1/auth/config` reports `configured: false`; explicit local demo remains available. Real authenticated API operations return `NOT_CONFIGURED` rather than creating a pretend school account.

## Database installation

The installation source is `supabase/migrations/`, generated and verified with Supabase CLI 2.119.0 against PostgreSQL 17. Seven migrations install the schema/RLS/RPC grants, private avatar storage, the nine experiments and private grading keys, teacher report aggregation, complete student progress summaries and four composite foreign-key indexes and individual student targeting. `supabase/seed.sql` repeats the catalog insertion idempotently for local resets. Never modify published version rows; future content changes require a new version and migration.

The old `schema.sql` is a legacy reference, not an installation script. The first migration deliberately refuses existing legacy assignment/result tables. Before installing on another project, inventory tables, policies, Auth users, migration history and PostgreSQL version. If legacy tables exist, export and verify them, review a conversion into the new tables, and retain unverified client grades as legacy records rather than authoritative assessments. The configured project `cidyenmlvuqciymnqzii` was inventoried on 2026-10-04: PostgreSQL 17.11, no application tables, no Auth users, no storage objects and no applied migrations. All seven migrations have now been applied through authenticated MCP; no legacy conversion or remote reset was necessary. MCP-generated history timestamps were aligned to the corresponding committed migration versions and verified to avoid replay by the CLI.

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

These fixtures refuse remote Supabase hosts. Integration checks cover nine assessed experiments, enrollment, private answer keys, real cookie authentication, duplicate/stale events, score tampering, assigned teacher access, snapshots, notes, private avatar upload and direct Data API isolation. The extended browser account suite passed with two independent contexts: published teacher questions/explanations, guided resume, persisted server scores/history, CSV downloads and cross-device notebook text export. Fixtures are soft-deleted to preserve assessed history references. These browser flows run against local Supabase and the development server; production cookies remain Secure and the deployed HTTPS account flow still requires staging verification.

GitHub Actions runs the production build, architecture/types/format checks, domain/API/UI suites and the production dependency audit on pushes and pull requests. Database and browser integration still require the disposable local Supabase environment; they are not executed by that workflow. An isolated production build and read-only smoke against the configured remote project passed: nine detailed experiments through the Next.js API, no answer keys in public DTOs, and denied anonymous identity/private-schema/privileged-RPC access. This is not a full authenticated staging run.

## Release status and recovery

Local baseline schema reset, generated index migration, advisors, integration, domain/API/UI checks and the production build have passed. Production dependency audit reports zero vulnerabilities at the last audit. Remote inventory, server credential verification and all seven migrations are complete. Remote security advisors have no WARN/ERROR: two INFO findings for policy-free private tables are intentional deny-by-default. Composite foreign-key findings were fixed; unused-index INFO findings on the fresh database require future workload evidence. Release still needs Auth/SMTP/domain and hosting configuration, full HTTPS staging verification, backup/operations verification and production operations. See the plan's checked tables for completed work and remaining gates.

Before deployment take a verified database backup, retain prior application build and record applied migrations. Database versions/results are immutable: rollback application code against compatible contracts, or apply a forward correction migration. Do not drop assessed history to fix deployment. Avatar cleanup failures are logged for storage maintenance. Rotate a leaked server key in Supabase and update server configuration; request IDs permit safe API error correlation without logging credentials or student answers.

## Assignment audience

`POST /api/v1/assignments/{id}/publish` accepts `revision` and `classIds` (1–20 owned, active classes). Omit `studentIds` for the whole active student roster, or provide 1–1000 student UUIDs to select a subset of those classes. Empty arrays are invalid; duplicates are deduplicated. The database verifies teacher/school ownership and active student enrollment before freezing recipients and writing notifications in one transaction. Recipient IDs appear only in teacher DTOs; student-facing configuration contains audience/count metadata. Repeating publication with unchanged targets is idempotent; changing a published audience returns `REVISION_CONFLICT`.

Both the builder and saved-draft publication form support this choice. Integration/browser checks cover individual targeting and preserve the existing class flow. See [production release steps](PRODUCTION.md) for hosting, Auth callbacks, SMTP and the remaining gates.

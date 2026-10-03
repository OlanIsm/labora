# Labora backend

Implementation is phased. See [the implementation plan](IMPLEMENTATION_PLAN.md) for schema, frontend migration, error contract, V1/V2 scope and current status.

## Current foundation

- `modules/identity/`: API-side login, registration, confirmation, logout and profile access.
- `shared/`: safe errors, HTTP validation, environment configuration and cookie-based Supabase client.
- HTTP adapters live under `frontend/app/api/v1/`; browser features use the shared API transport.
- Shared DTOs live in `shared/contracts/` at the repository root, accessed through path aliases. One Next.js deployment; no packages monorepo.

## Configuration

Copy `frontend/.env.example` to `frontend/.env.local` and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and the deployment's canonical `APP_URL`. The Supabase project must allow the application's `/api/v1/auth/confirm` redirect URL. Credentials stay server-side and uncommitted. Existing `NEXT_PUBLIC_SUPABASE_*` names are read on the server for migration compatibility; new configuration uses the server variables.

Without configuration, `/api/v1/auth/config` reports `configured: false`; explicit local demo remains available. Real authenticated API operations return `NOT_CONFIGURED` rather than creating a pretend school account.

The proposed profile/membership schema must be created through reviewed migrations before enabling real account workflows. The current `schema.sql` is a legacy reference, not the new backend's installation script. Do not apply its metadata-based policies to install the proposed backend. Remote inventory and migration implementation are pending.

## Verification

From `frontend/`:

```sh
npm run check
npm run test:api
npm test
npm run build
```

For browser checks, start the app and run `npm run test:browser` with `LABORA_BASE_URL` and `LABORA_PLAYWRIGHT` pointing to the app and Playwright install. Browser/unit checks verify the HTTP/auth boundary and demo regressions; they do not certify the remote database's RLS or real multi-account workflows. Those checks are required before V1 release.

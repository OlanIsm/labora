# Labora: backend and database implementation plan

Status: proposed for review. This document does not create tables, apply migrations, or change application behavior.

## 1. Existing application

Repository inspection shows:

- Next.js 15, React, TypeScript, and Supabase JS are already installed.
- Auth currently reconstructs roles and class names from editable user metadata. Browser profiles also serve as demo sessions.
- `backend/schema.sql` defines only `assignments` and `experiment_results`. Both store their main contents in JSON. Result upserts replace the previous result for the same student and experiment.
- Existing RLS policies depend on editable `user_metadata.role` and `user_metadata.className`.
- Experiment runtime, bench configurations, lab notebooks, and notification read state live in browser storage.
- Quiz answer keys and scoring currently run in the frontend. Assignment stages support custom instructions/questions, but do not yet provide a versioned, authoritative assessment workflow.
- Authentication of the configured MCP server was verified in the previous setup task. Live database contents have not been inspected during this planning task; the existing SQL file must not be assumed to reflect the remote database.

## 2. Architecture decision

Use a modular monolith: one Next.js deployment, backend business modules in `backend/`, and one Supabase project for Auth, PostgreSQL, and Storage.

Next.js Route Handlers are thin HTTP adapters. They validate the session, call backend use cases, and translate responses. Business rules and database access belong to backend modules. Frontend components call typed API clients rather than making assessment writes directly to database tables.

```text
frontend/
  app/api/v1/          Thin Next.js HTTP adapters
  features/           Existing UI, application hooks, API adapters
  shared/             Browser infrastructure and presentation utilities
backend/
  modules/
    identity/         Profiles, sessions, membership and invitations
    classrooms/       Minimal classes and student enrollment
    catalog/          Experiment definitions and immutable versions
    assignments/      Drafts, publication, targeting and assessment configuration
    sessions/         Guided attempts, bench saves, actions and notebooks
    assessment/       Answer evaluation, official scores and result review
    progress/         Student history and teacher reports
    notifications/    Notifications and read state
  shared/             Request context, validation, errors and database clients
  supabase/
    config.toml
    migrations/
    seed.sql
  tests/              Authorization, transactions and workflow integration tests
packages/
  experiment-engine/  Pure shared transitions and scientific calculations
  contracts/          Public request/response types and validation contracts
```

Only move pure logic that actually needs to run on both sides. Do not import React, browser storage, Supabase clients, or private answer keys into the shared engine. Extend the current architecture checker to enforce these boundaries and prevent server secrets from entering client bundles.

Use existing Supabase JS, add `@supabase/ssr` for cookie sessions, and pin dependency versions. Use SQL migrations and generated database types. No additional ORM is needed for this architecture.

Simulations and animation frames stay in the browser. The server validates assessed actions, evaluates answers, persists work, and calculates official results. It does not stream physics animation frames or chemistry rendering updates over the network.

## 3. Proposed database schema

Use UUID primary keys for account-owned records, `timestamptz` timestamps, foreign keys, explicit status constraints, and indexes matching real access queries. Preserve existing experiment slugs such as `acid-base` as stable catalog IDs.

### Identity and minimal classroom scope

| Table | Proposed important columns | Purpose / constraints |
| --- | --- | --- |
| `profiles` | `id` → `auth.users`, `display_name`, `avatar_path`, `preferences jsonb`, `created_at`, `updated_at` | Public application profile. Preferences have a validated shape. Passwords and email authentication stay in Supabase Auth. |
| `schools` | `id`, `name`, `owner_id` → profiles, `created_at` | Tenant identity, including a small workspace for a teacher starting independently. |
| `school_members` | `school_id`, `user_id`, `role`, `status`, `joined_at` | Composite PK `(school_id, user_id)`. Role is `student` or `teacher`, assigned through authorized enrollment. |
| `classes` | `id`, `school_id`, `teacher_id`, `name`, `archived_at`, `created_at` | Minimal teacher-owned class. A class name is a display label, never an authorization key. |
| `class_members` | `class_id`, `student_id`, `joined_at`, `left_at` | Unique class/student membership. Student must belong to the class's school. |
| `invitations` | `id`, `school_id`, `class_id?`, `invited_email?`, `role`, `token_hash`, `created_by`, `expires_at`, `max_uses`, `uses`, `revoked_at` | Expiring enrollment links/codes. Store hashes, not raw reusable secrets. Teacher invitations require authorized school ownership; students cannot request a teacher role. |

A teacher may create their own school/workspace, becoming its initial teacher/owner through one controlled transaction. Joining another school or class requires an invitation. No attendance, billing, timetables, or separate school-admin dashboard is included.

### Catalog and teacher assignments

| Table | Proposed important columns | Purpose / constraints |
| --- | --- | --- |
| `experiments` | `id text`, `subject`, `title`, `summary`, `duration_minutes`, `current_version_id`, `published`, `created_at` | Searchable metadata for the nine guided experiments. Subjects are Chemistry, Physics, and Biology. |
| `experiment_versions` | `id`, `experiment_id`, `version`, `definition jsonb`, `engine_version`, `created_at` | Immutable released definitions with steps, equipment and public questions. Unique `(experiment_id, version)`. Definitions exclude correct answers. |
| `assignments` | `id`, `school_id`, `teacher_id`, `experiment_id`, `title`, `status`, `due_at?`, `draft_config jsonb`, `published_version_id?`, `created_at`, `updated_at` | Teacher-owned draft/publication lifecycle. Draft config has explicit instructions, allowed actions, hints, questions and scoring rules. |
| `assignment_versions` | `id`, `assignment_id`, `version`, `experiment_version_id`, `config jsonb`, `published_at` | Immutable compiled activity, pinned to an experiment version. Unique `(assignment_id, version)`. Editing a publication creates another version. |
| `assignment_targets` | `id`, `assignment_id`, `class_id?`, `student_id?` | Exactly one class or individual student per row. Targets must belong to the assignment's school and teacher's authorized scope. |
| `assignment_recipients` | `assignment_version_id`, `student_id`, `source_class_id?`, `assigned_at` | Unique `(assignment_version_id, student_id)`. Publication freezes the student roster so completion percentages have a stable denominator. |

Students joining a class after publication do not silently change an existing assignment's recipient list. A teacher can explicitly assign that published version to the new students. Repeat targeting through multiple classes must not duplicate recipients.

JSONB is appropriate for variable experiment definitions and validated stage configuration. Ownership, membership, versions, recipient identity, status, scores and timestamps remain relational columns.

### Runtime, assessment and supporting data

| Table | Proposed important columns | Purpose / constraints |
| --- | --- | --- |
| `lab_sessions` | `id`, `student_id`, `mode`, `subject`, `simulation_key?`, `experiment_version_id?`, `assignment_version_id?`, `status`, `current_step`, `state jsonb`, `state_version`, `revision`, `started_at`, `last_saved_at`, `submitted_at?` | Every guided attempt is its own session. Sandbox sessions store versioned bench/simulation saves. Guided sessions require an experiment version; assignment attempts require valid recipient access. |
| `lab_actions` | `id`, `session_id`, `client_event_id`, `sequence`, `action_type`, `payload jsonb`, `accepted`, `feedback`, `created_at` | Assessed action history, including useful incorrect actions. Unique event IDs prevent duplicate effects; sequence/revision checks handle conflicting saves. Free animation frames are not recorded here. |
| `quiz_responses` | `id`, `session_id`, `question_key`, `attempt_no`, `answer jsonb`, `is_correct`, `points_awarded`, `answered_at` | Append-only answers and attempts. Supports MCQ, true/false and prediction questions. Unique `(session_id, question_key, attempt_no)`. Correctness and points are server-generated. |
| `experiment_results` | `id`, `session_id`, `student_id`, `experiment_version_id`, `assignment_version_id?`, `experiment_accuracy`, `quiz_accuracy`, `score`, `steps_completed`, `steps_total`, `scoring_version`, `observations jsonb`, `completed_at` | One immutable result per submitted session. Percentages constrained to 0–100. Each retry creates another session/result rather than overwriting history. |
| `lab_notes` | `id`, `session_id`, `author_id`, `hypothesis`, `observation`, `conclusion`, `measurement_snapshot jsonb`, `created_at`, `updated_at` | Account-owned notebook entries and exportable observations. Notes are saved separately from bench rendering state. |
| `notifications` | `id`, `recipient_id`, `type`, `assignment_version_id?`, `result_id?`, `dedupe_key`, `read_at?`, `created_at` | Real assignment/result notifications. Unique recipient/dedupe key prevents retry duplicates. All read state is account-scoped. |
| `private.answer_keys` | `id`, `experiment_version_id?`, `assignment_version_id?`, `question_key`, `correct_answer jsonb`, `explanation`, `rubric jsonb` | Private, unexposed schema. Exactly one version parent; unique question key within its parent. Only authorized backend grading/teacher editing paths can access it. |

Keep answer keys out of the public definition JSON and out of browser bundles. Return feedback after an authorized answer according to the activity's review policy. Prediction questions are structured choice/true-false questions in the first release; free-text predictions may be saved as notes, but are not presented as automatically graded answers.

### Required database rules

- Index foreign keys used for joins/RLS, and queries such as sessions by student/date, assignments by school/teacher/status, recipients by student, responses by session, and unread notifications by recipient.
- Enforce one current experiment version belonging to that experiment and one published assignment version belonging to that assignment; pin sessions to those versions.
- Enforce school consistency for memberships, classes, targets and assignment recipients through relational constraints and narrow transactional functions where cross-table validation is required.
- Published versions and submitted results cannot be edited through ordinary browser CRUD.
- Restrict deletes: archive catalog/class/assignment records used by history. Account deletion follows an explicit retention/deletion flow rather than cascading away class assessments unexpectedly.
- Publish assignment version, recipient roster and notifications atomically. Finalize session, responses/result and completion notification atomically.

## 4. Access and authentication

Use cookie-backed Supabase sessions with `@supabase/ssr`, verified server identity, and Next.js 15 `middleware.ts` for refresh. Never accept a user ID or role from localStorage as proof of authentication. See [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).

Store authorization in server-managed membership rows. User metadata may contain a display name, but cannot grant teacher permissions or class access. Students cannot grant themselves school/class membership by changing a profile field. Enable RLS on all exposed tables and define explicit ownership/membership predicates and mutation checks. See [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

| Actor | Allowed access |
| --- | --- |
| Guest/demo | Public catalog and local simulations. No school data or official grades. |
| Student | Own profile, sessions, answers, notes, results and notifications; published assignments addressed to them. |
| Teacher | Own/authorized classes, assignment drafts and publications, and students' attempts for those assignments. No unrestricted access to all students in a school. |
| Backend grading/enrollment operation | Narrow verified operations only; keys remain server-side and actor identity comes from the verified request. |

Normal data access uses the authenticated user's Supabase context so RLS remains active. Exceptional grading/enrollment operations use narrowly granted internal database functions with explicit actor/scope checks. Do not expose a generic privileged query endpoint or accept client-provided scores, completion flags, recipients, role changes or answer correctness.

Avatar uploads use Supabase Storage with user-owned paths, image MIME/size limits and access policies. Branding assets remain in `frontend/public`. See [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## 5. API contract

All application endpoints live under `/api/v1`. Use consistent error responses, bounded pagination, payload validation, session checks, appropriate status codes, request IDs, origin checks for cookie-authenticated mutations, and rate limits on sensitive/expensive operations. Authentication SDK operations use Supabase Auth rather than a custom password store.

| Area | Endpoints / operations |
| --- | --- |
| Identity | `GET/PATCH /me`; auth confirmation/callback, password recovery and logout; avatar upload |
| Enrollment | Create school/workspace; list memberships; create/revoke/accept invitations |
| Classes | `GET/POST /classes`; manage owned class membership and archive a class |
| Catalog | `GET /experiments`; `GET /experiments/:id`; versioned public definitions |
| Assignments | `GET/POST /assignments`; `GET/PATCH /assignments/:id`; publish/archive; explicitly add eligible recipients |
| Guided attempts | `POST /sessions`; `GET /sessions/:id`; `POST /sessions/:id/actions`; `POST /sessions/:id/answers`; `POST /sessions/:id/submit` |
| Sandbox saves | List/create sessions; `PATCH /sessions/:id/state` with expected revision and validated state |
| Notebooks | List/create/update notes for an owned session; authenticated export |
| Progress | `GET /progress`; `GET /results/:id`; student dashboard summary |
| Teacher reporting | Assignment recipient completion, selected/best attempt, all attempt history, question/incorrect-answer breakdown and CSV export |
| Notifications | Paginated list; mark one/all read; account-level unread count |

An action/answer request includes an idempotency event ID and expected session revision. Repeated identical requests return the existing outcome. Reusing an ID with a different payload is rejected. A stale revision returns a conflict and the canonical state for recovery.

Do not send entire simulation state for every drag movement. Save sandbox snapshots after meaningful changes with debounce, flush on supported lifecycle transitions, and display the save/sync state.

## 6. Official assessment behavior

1. Starting an activity creates a session pinned to the experiment and assignment versions.
2. The browser animates locally; assessed actions are validated against the canonical server runtime and required equipment/order.
3. Validated mistakes produce educational feedback and are recorded without crashing or immediately failing the attempt.
4. Answers are evaluated against private keys. Store each permitted attempt and the activity's immutable scoring/retry policy.
5. Submission checks required steps, questions, recipient access, attempt limits and due-date policy.
6. The backend calculates step accuracy, quiz accuracy and total score. Default weighting can preserve today's 40% steps / 60% quiz, but must be documented and versioned. Quiz steps must not accidentally count twice as scientific-action accuracy.
7. A transaction finalizes the session/result. Repeated submission returns the same result.
8. Feedback includes observations, incorrect answers and explanations allowed by the review policy.

Default assignment reporting uses the highest completed eligible attempt, with all attempts visible to the teacher. Attempt limit, deadline acceptance and immediate feedback are explicit assignment configuration, not inferred from client state.

## 7. Synchronization and existing data

- Demo mode remains explicitly local. It must not impersonate an authenticated school account.
- Account caches and pending work are namespaced by user ID, session ID and schema version; clear account-specific in-memory state on logout.
- For authenticated guided work, queue action requests while offline and reconcile them through server validation on reconnect. Pending work is clearly marked; no official offline score is accepted from the browser.
- Free-lab saves use revision checks and preserve a conflicting local draft rather than silently overwriting newer cloud work.
- Existing browser results can be offered as local practice history after user confirmation. Do not silently import them as teacher-assessed grades.
- Inspect remote tables and data before migration. Preserve legacy assignments/results, map identities and class memberships, and flag records that cannot be safely mapped. Names alone cannot establish ownership.
- Preserve existing experiment URLs and IDs. Result adapters support the current latest-result route while new attempt-specific result IDs retain full history.

## 8. Implementation sequence and review gates

| Phase | Work | Completion evidence |
| --- | --- | --- |
| 0. Review and remote inventory | Review this schema proposal; read live schema/policies, project config and existing data without mutation | Confirmed migration inventory and approved schema decisions before SQL is applied |
| 1. Backend foundation | Wire workspace packages, Route Handler adapters, validation/errors, cookie sessions, server-only clients and architecture checks | Authenticated API request works; forged/local/demo identity cannot access school data |
| 2. Identity and classroom schema | Profiles, schools, memberships, classes, invitations, constraints and RLS | Two separate schools cannot read/write each other's data; enrollment and role escalation tests pass |
| 3. Catalog and versioning | Seed nine experiments; public definitions/private answer keys; shared pure engine | All three subjects load; answer keys absent from catalog responses/client bundle; old sessions retain their definition version |
| 4. Sessions and assessment | Guided actions/answers, immutable scoring, submission transactions and sandbox snapshot persistence | Acid/Base, Ohm's Law and microscope activities complete with server-generated results; invalid actions, duplicate requests and concurrent writes are handled |
| 5. Teacher activities | Builder stage validation, draft editing, publication, targets/recipients and report queries | Teacher creates/publishes a task; eligible students receive it; unauthorized students cannot access it; reports match stored responses |
| 6. App integration | Dashboard, history, continue activity, notes, settings/avatar and persistent notifications | Work continues across two browsers/devices; teacher sees assignment results; logout isolates the next user's cache |
| 7. Migration and release | Reviewed migrations, legacy-data conversion, production config, advisors, backup/restore procedure and operational logs | Migrations reproduce schema from scratch; authorization/flow tests, TypeScript and production build pass; migration verification and recovery steps documented |

Each phase has runnable tests for meaningful risks. Priority tests cover cross-user/cross-school access, role escalation, class impersonation, guessed session/assignment IDs, answer-key disclosure, score tampering, duplicate publication/submission, stale revisions, version pinning, account switching and the full student/teacher workflow.

Use Supabase local development for migrations/tests where available. Inspect database security advisors before release. Apply reviewed migrations to the requested project only after the user's schema review; installing MCP access is not an instruction to run this schema now.

## 9. Expected delivery

- Backend modules and typed HTTP contracts integrated with the existing app.
- Reproducible database migrations, seed content, RLS/storage policies and generated types.
- Official assessment and persistent attempts/history, teacher assignments/results, bench saves, notebooks, settings and notifications.
- Setup/environment documentation, local test commands, migration verification, recovery procedure and a concise operational guide.

This release keeps classroom functionality limited to experiment distribution and assessments. Live collaboration, video lessons, billing, proctoring, AI grading and a full school administration system are outside the current scope.

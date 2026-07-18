# 08 · Project Backlog

This is the single source of truth for future work. Keep implementation detail
in the relevant numbered design document and use this file to track priority,
status, dependencies, and acceptance criteria.

## Status and priority

- Status: `ready`, `in_progress`, `blocked`, `done`, or `deferred`
- Priority: `P0` submission blocker, `P1` important demo value, `P2` polish or
  post-MVP
- Only mark an item `done` after its acceptance criteria have been verified.
- Add newly discovered work here instead of leaving it only in chat, comments,
  or memory.

## Current milestone

Achieved and live-verified on 2026-07-18:

`simulation -> capacity alert -> grounded recommendation -> operator handles alert`

## Phase 0–5 implementation audit

Audited against the consolidated implementation checklist and repository state
on 2026-07-18. `Complete` means the implementation exists in the repository;
it does not claim that an external Supabase or Vercel environment was manually
verified. External-only facts are explicitly marked `Verify externally`.

### Phase 0 — Pre-flight

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Create the real Supabase project | Complete | The configured remote project accepted authenticated service-role seed and verification requests on 2026-07-18 |
| Apply `0001_init.sql` | Partial | Migration exists with all documented tables, indexes, RLS, and policies. Live role verification confirms the expected tables are present and readable, but exact remote migration history and the full policy matrix remain unverified |
| Seed venues, zones, and gates | Complete | Committed `0002_seed.sql` provides deterministic, repeatable reference rows for two synthetic venues, twelve zones, and eleven gates |
| Configure Supabase URL and anon key | Complete locally | The configured project is reachable; values remain unprinted and uncommitted. Verify deployment variables separately |
| Configure service-role key | Complete locally | `npm.cmd run seed:demo` completed privileged writes and verification without exposing the key. Verify deployment variables separately |
| Add checked-in environment example | Complete | The checked-in environment template lists the required Supabase and AI variable names without secret values |
| Build privileged Supabase client | Complete | `src/lib/supabase/service-role.ts` creates a non-persistent server-only service-role client |

### Phase 1 — Auth and routing

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Real email/password login | Complete | Login calls `signInWithPassword` and routes after success |
| Session and role route guard | Complete in code, verification remains | Middleware and dashboard layout verify the session, query protected `user_roles`, and redirect by the documented matrix |
| Pass real role to `RoleNav` | Complete | Dashboard layout derives the role from the authenticated user and passes it to role-filtered navigation |
| Create four demo users | Complete | Remote Auth audit found four users on 2026-07-18 |
| Configure demo-user roles | Complete | All four Auth users have protected `user_roles` rows; no remote users were left unassigned |

### Phase 2 — Data simulation

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Implement `/api/simulate-tick` | Complete | Route generates and bulk-inserts all telemetry categories, authenticates cron/Admin/Ops callers, consumes a durable limit, and invokes alert detection directly |
| Generate coherent match-phase values | Complete | Pre-kickoff, in-play, and post-match phases drive occupancy, scans, and sustainability load with bounded jitter |
| Configure deployed/local trigger | Complete in code | `vercel.json` schedules a minute cron and Admin/Ops `DashboardPoller` triggers bounded manual ticks. Configure `CRON_SECRET` when creating the eventual Vercel deployment |
| Confirm rows land in Supabase | Complete | Live role verification on 2026-07-18 confirmed populated telemetry tables: 1,995 zone rows, 1,640 gate-scan rows, and 2,124 sustainability rows |

### Phase 3 — Core dashboards

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Replace four placeholder dashboards | Complete for Phase 3 | Overview, Ops, Sustainability, and Volunteer views read real data; gate throughput is implemented and the unsupported advisor placeholder is removed until Phase 6 |
| Wire Realtime dashboard updates | Complete in code, verification remains | Ops gauges/trends/heatmap/gates, sustainability, volunteers, overview, and alerts now respond to Realtime changes; hosted publication and tick behavior require P0-13 verification |
| Confirm role-appropriate dashboard UX | Complete in code, verification remains | Navigation, login destinations, middleware guards, and trusted role lookup follow the documented matrix; four-role manual verification remains |

### Phase 4 — Alerts

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Implement threshold and duplicate prevention | Complete | Shared detection applies warning/critical thresholds, skips open-alert zones, bounds creation to three alerts/run, and is invoked directly by each successful tick |
| Generate one cached AI recommendation | Complete | Alert creation uses Fireworks JSON-schema output and stores typed audit fields once; invalid/unavailable AI is explicitly labeled as a deterministic safety fallback |
| Build incident feed | Complete in code, verification remains | `/ops/alerts` is linked for Admin/Ops, refreshes on Realtime changes, and includes loading, error, retry, empty, and handled states |
| Mark alert handled through user session | Complete, external RLS verification remains | PATCH authenticates the user and updates through the session client; the database policy must still be tested with all roles |

### Phase 5 — AI copilot

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Fetch context, call model, and stream | Partial | Authenticated streaming works over a 15-minute data slice, but the slice is not venue/role scoped and DATA plus QUESTION share one user-message string |
| Apply prompt-injection defenses | Complete | Fixed system instructions, input cap, separate DATA/question content blocks, text-only rendering, stale/missing rules, and committed adversarial contract evaluation are in place |
| Connect `CopilotPanel` to API | Complete | Panel posts questions and consumes the SSE stream |
| Show grounding indicator | Complete | Metadata and final grounding summary are rendered on assistant messages |
| Log copilot exchanges | Complete, reliability verification remains | Service-role insert exists after streaming; insert errors are not surfaced or logged, and live persistence is not verified |

### Phase 6 — Resource Allocation Advisor

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Derive staffing suggestions from current/predicted occupancy | Not started | The misleading placeholder was removed from Ops; implement the real advisor under P1-01 |
| Constrain recommendations to structured JSON | Not started | No advisor schema, validation, or structured-output prompt exists |
| Refresh advisor panel with live data | Not started | No advisor API/function or live panel is connected to simulation/telemetry updates |

### Phase 7 — Security hardening

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Rate-limit copilot and simulation APIs | Complete | Migration `0006` is applied; atomic exhaustion and route-level 429 behavior are verified, and all limits are consumed before paid or privileged work |
| Top-level React error boundary | Not started | No `error.tsx` or `global-error.tsx` exists under `src/app` |
| Adversarial prompt-injection test | Complete | `npm.cmd run eval:prompts` passes normal, warning, critical, missing, stale, irrelevant, injection, parsing, and structured-fallback expectations |
| Verify RLS on every live table | Complete for current schema | Applied migrations enable RLS on every documented table; live role reads, anonymous denial, cross-role write denial, authorized writes, and server-only limiter access were verified on 2026-07-18 |
| Audit git history for secrets | Complete for current history | Every revision was scanned without printing content for common Anthropic, OpenAI, Supabase, and JWT secret signatures; no matches were found. Re-run immediately before submission |
| Confirm `.env*` ignored throughout history | Partial | No `.env*` file appears in tracked history, but the root commit did not yet contain the `.env*` ignore rule, so the stricter doc-07 wording "gitignored from the first commit" is not satisfied |
| Attempt cross-role access violations | Complete for database policies | `verify:p0-hosted` confirmed unauthorized alert/volunteer writes return no rows while Admin/Ops/Coordinator permitted writes succeed; route-navigation UX remains under P1-05 |
| Add GitHub Actions lint/typecheck workflow | Complete in code | `.github/workflows/ci.yml` runs install, lint, TypeScript, and prompt evaluations on pushes and pull requests; first hosted run remains to be observed |
| Protect privileged service-role routes | Complete | Local route integration against hosted services returned 401 without credentials, 200 with the cron bearer secret, and 429 after exhaustion; authorization precedes service-role writes and AI calls |
| Move authorization to trusted role source | Complete in code, verification remains | Protected `user_roles`, route guards, alert API, and update policies are implemented in migration/code; apply and test against hosted Supabase |

### Phase 8 — Polish and submission

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Accessibility pass | Partial | Components include several labels and focus styles, but no recorded keyboard, screen-reader, contrast, chart-summary, or reduced-motion audit exists |
| Repository size check | Complete for current state | Prospective tracked files including the P0 work total about 583 KB and loose Git objects remain under 1 MB, comfortably below 10 MB; recheck immediately before submission |
| Single-branch check | Complete for current state | Local and remote branch listing contains only `main` (plus `origin/HEAD` pointing to `origin/main`); recheck before submission |
| Submission README | Complete | README documents prerequisites, safe variables, migrations, seeds, role provisioning, commands, architecture, recovery, deterministic demo steps, simulation disclosure, and LinkedIn submission scope |
| State synthetic-data assumption | Complete | README explicitly explains unavailable FIFA telemetry, realistic simulation, and feed-swappable architecture |
| Prepare LinkedIn submission post | Not started | Tracked by SUB-01; a separately recorded video is not treated as required |
| Final push and submission tag | Not started | Perform only after all audits pass and the user explicitly requests publication actions |

### P0 — Submission blockers

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P0-01 | done | Restore a clean lint baseline | `npm.cmd run lint` exits successfully with no errors or warnings after typing the AI stream, converting database types to UTF-8, and removing an unused legacy hook |
| P0-02 | done | Make the production build deterministic | Inter and JetBrains Mono are bundled from local npm packages; `npm.cmd run build` and TypeScript pass without a Google Fonts request |
| P0-03 | done | Protect privileged system routes | Cron-secret and trusted-role checks run before privileged work; integration returned 401 without credentials and 200 with the trusted cron secret against hosted services |
| P0-04 | done | Move roles to a trusted source | `0003_user_roles_and_realtime.sql` creates protected `user_roles`; login, layout, middleware, alert API, and update policies no longer authorize from editable metadata |
| P0-05 | done | Complete the automatic alert loop | Isolated live verification passed threshold detection, JSON-schema AI generation, alert insert, and Realtime delivery; each successful tick invokes the same detector directly and open zones are skipped |
| P0-06 | done | Add API rate limiting | Applied durable limiter enforces documented limits; atomic exhaustion and route 429 behavior pass without invoking further privileged work |
| P0-07 | done | Make recommendations auditable | Applied typed columns and UI render action, urgency, evidence, limitations, confidence, source, and snapshot time; live structured AI creation passed |
| P0-08 | done | Create prompt evaluation scenarios | `npm.cmd run eval:prompts` passes seven behavior-oriented scenarios covering normal, warning, critical, stale/missing data, irrelevant scope, injection defenses, and structured parsing |
| P0-09 | done | Create a deterministic demo setup | `npm.cmd run demo:reset` successfully created a live 96% critical scenario with a genuine JSON-schema model recommendation and documented human handling step |
| P0-10 | done | Finish core README setup | README now covers prerequisites, safe variables, migrations/seeds, role provisioning, local verification, architecture, simulation disclosure, recovery, demo flow, and LinkedIn submission scope |
| P0-11 | done | Add reproducible demo seeds | `0002_seed.sql` creates stable venue/zone/gate references and `0004_seed_volunteers.sql` creates fictional volunteer assignments; live application remains under P0-13 |
| P0-13 | done | Verify the external Supabase demo environment | Migration history was reconciled and `0006`/`0007` applied. Live checks pass role reads, anonymous/cross-role denial, authorized writes, durable limits, fresh simulation inserts, threshold detection, and Realtime telemetry/alert delivery |
| P0-14 | done | Add continuous integration | `.github/workflows/ci.yml` runs npm install, lint, TypeScript, and prompt contract evaluation; local versions of all commands pass |

### P1 — Judge-visible product value

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P1-01 | ready | Resource Allocation Advisor | Current occupancy produces structured staffing recommendations with evidence; the panel handles unavailable AI or data honestly |
| P1-02 | done | Gate throughput chart | Ops aggregates timestamped scans into a live trend, identifies the busiest gate, and provides an accessible text equivalent |
| P1-03 | ready | Volunteer reassignment | Authorized coordinators/admins can reassign a volunteer; RLS enforces the action and Realtime updates the view |
| P1-04 | ready | Human feedback on AI recommendations | Operator can accept, reject, or mark handled; the recorded state clearly distinguishes recommendation from executed action |
| P1-05 | in_progress | Role-flow consistency | Code follows the documented role matrix and trusted table; complete the four-account manual route/API matrix before marking done |
| P1-06 | ready | Copilot data relevance | The server selects only role- and venue-relevant current data, detects stale snapshots, and exposes the exact evidence summary to the user |
| P1-07 | ready | Copilot retention job | Query logs older than the documented retention window are removed by a protected scheduled job and the policy is documented |
| P1-08 | ready | Error and empty states | Top-level error boundary and affected screens show safe, useful messages without stack traces or fabricated fallback data |
| P1-09 | ready | Accessibility pass | Keyboard flow, visible focus, chart summaries, non-color status cues, contrast, and reduced-motion behavior meet the UI brief |
| P1-10 | in_progress | Complete Phase 3 Realtime wiring | Client subscriptions and publication migration cover Phase 3 dashboards; verify hosted writes and UI changes without refresh under P0-13 |
| P1-11 | in_progress | Integrate the incident feed into the Ops workflow | Navigation, Realtime refresh, handling, and safe states are implemented; verify hosted insert/update behavior before marking done |
| P1-12 | ready | Make copilot audit logging reliable | Logging failures are recorded server-side without breaking the completed user stream; successful persistence is verified and retention behavior matches the documented policy |

### P2 — Polish and scale narrative

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P2-01 | ready | Admin venue drill-down | Admin can open a venue-specific operational view without losing venue scope |
| P2-02 | ready | Multi-venue comparison | Admin can compare the small set of metrics needed for cross-venue decisions |
| P2-03 | ready | Match summary export | A grounded end-of-match summary clearly separates measured facts from generated analysis |
| P2-04 | ready | Telemetry retention/rollups | Old raw telemetry is safely summarized or purged according to a documented storage policy |
| P2-05 | ready | Observability upgrade | Structured logs include safe request context; production monitoring recommendations are documented without exposing secrets or user questions |
| P2-06 | ready | Migrate middleware convention | Replace deprecated `middleware.ts` with the Next.js 16-supported proxy convention and verify all redirects and cookies |

## Current local verification

On 2026-07-18, lint, TypeScript, the prompt contract evaluation, and the
production build all pass. The build uses local font packages and makes no
Google Fonts request. Next.js still reports the separately tracked middleware
deprecation warning (P2-06). `npm.cmd audit --omit=dev` reports zero known
vulnerabilities after a narrow PostCSS 8.5.10 override for the advisory in
Next.js 16.2.10's transitive dependency.

## Prompt Wars submission work

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| SUB-01 | ready | LinkedIn submission post | Post explains the problem, simulated-data assumption, grounded decision loop, safeguards, impact, and includes the project/demo link |
| SUB-02 | ready | Final security audit | Every applicable checkbox in doc 07 is verified and results are recorded |
| SUB-03 | ready | Repository audit | Public repository, branch, size, secrets, setup instructions, licensing/assets, and reproducible migrations are checked before submission |
| SUB-04 | ready | Final publish and tag | After explicit user authorization, the verified final state is committed, pushed to `main`, and tagged with the agreed submission tag |

## Completed planning work

| ID | Status | Work | Verification |
|---|---|---|---|
| PLAN-01 | done | Align PRD and implementation plan to the Prompt Wars stadium challenge | Docs 01, 02, and 06 contain challenge alignment, GenAI contract, critical path, and submission package |
| PLAN-02 | done | Establish agent guidance and a persistent backlog | Root `AGENTS.md`, `docs/README.md`, and this backlog exist and are linked |
| PLAN-03 | done | Audit consolidated checklist Phases 0–8 against the repository | Phase audit above records complete, partial, unverified, and missing work; remaining items map to P0/P1/P2 and submission backlog entries |

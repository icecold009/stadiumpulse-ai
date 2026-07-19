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
on 2026-07-18 and reconciled with current hosted evidence on 2026-07-19.
`Complete` means the implementation exists in the repository;
it does not claim that an external Supabase or Vercel environment was manually
verified. External-only facts are explicitly marked `Verify externally`.

### Phase 0 — Pre-flight

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Create the real Supabase project | Complete | The configured remote project accepted authenticated service-role seed and verification requests on 2026-07-18 |
| Apply committed migrations | Complete through `0009` | Local and remote migration history match through `0009_user_venue_access.sql`; hosted role, RLS, venue-assignment, and Realtime verification passed after application on 2026-07-18 |
| Seed venues, zones, and gates | Complete | Committed `0002_seed.sql` provides deterministic, repeatable reference rows for two synthetic venues, twelve zones, and eleven gates |
| Configure Supabase URL and anon key | Complete | The local and deployed applications reach the configured project; values remain unprinted and uncommitted |
| Configure service-role key | Complete | `npm.cmd run seed:demo` and hosted privileged-route verification completed without exposing the key; the deployment performs protected server-side operations successfully |
| Add checked-in environment example | Complete | The checked-in environment template lists the required Supabase and AI variable names without secret values |
| Build privileged Supabase client | Complete | `src/lib/supabase/service-role.ts` creates a non-persistent server-only service-role client |

### Phase 1 — Auth and routing

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Real email/password login | Complete | Login calls `signInWithPassword` and routes after success |
| Session and role route guard | Complete | The deployed four-role page matrix passed on 2026-07-18: allowed pages returned 200 and forbidden pages redirected to each role's trusted default |
| Pass real role to `RoleNav` | Complete | Dashboard layout derives the role from the authenticated user and passes it to role-filtered navigation |
| Create four demo users | Complete | Remote Auth audit found four users on 2026-07-18 |
| Configure demo-user roles | Complete | All four Auth users have protected `user_roles` rows; no remote users were left unassigned |

### Phase 2 — Data simulation

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Implement `/api/simulate-tick` | Complete | Route generates and bulk-inserts all telemetry categories, authenticates cron/Admin/Ops callers, consumes a durable limit, and invokes alert detection directly |
| Generate coherent match-phase values | Complete | Pre-kickoff, in-play, and post-match phases drive occupancy, scans, and sustainability load with bounded jitter |
| Configure deployed/local trigger | Complete in code | `vercel.json` schedules a Hobby-compatible daily health tick while the Admin/Ops `DashboardPoller` supplies bounded active-demo ticks. Configure `CRON_SECRET` in Vercel before production verification |
| Confirm rows land in Supabase | Complete | Live role verification on 2026-07-18 confirmed populated telemetry tables: 1,995 zone rows, 1,640 gate-scan rows, and 2,124 sustainability rows |

### Phase 3 — Core dashboards

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Replace four placeholder dashboards | Complete for Phase 3 | Overview, Ops, Sustainability, and Volunteer views read real data; gate throughput is implemented and the unsupported advisor placeholder is removed until Phase 6 |
| Wire Realtime dashboard updates | Complete in code, UI verification remains | Ops gauges/trends/heatmap/gates, sustainability, volunteers, overview, and alerts subscribe to Realtime changes. Hosted publication and event delivery passed on 2026-07-18; visible no-refresh dashboard updates remain under P1-10 |
| Confirm role-appropriate dashboard UX | Complete | Passwordless sessions for all four deployed roles reached only their documented pages; cross-role pages redirected to the trusted default |

### Phase 4 — Alerts

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Implement threshold and duplicate prevention | Complete | Shared detection applies warning/critical thresholds, skips open-alert zones, bounds creation to three alerts/run, and is invoked directly by each successful tick |
| Generate one cached AI recommendation | Complete | Alert creation uses Fireworks JSON-schema output and stores typed audit fields once; invalid/unavailable AI is explicitly labeled as a deterministic safety fallback |
| Build incident feed | Complete in code, UI verification remains | `/ops/alerts` is linked for Admin/Ops, refreshes on Realtime changes, and includes loading, error, retry, empty, and handled states. Hosted alert insert/update and RLS behavior pass; visible Realtime workflow verification remains under P1-11 |
| Mark alert handled through user session | Complete | PATCH authenticates the user and updates through the session client; live Ops handling plus cross-role RLS denial passed on 2026-07-18 |

### Phase 5 — AI copilot

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Fetch context, call model, and stream | Complete | The deployed route returned non-empty grounded streams for all four roles on 2026-07-19. Ops received crowd/alert context, Sustainability received metric context, Volunteer received assignment context, and Admin received the combined authorized slice, all limited to authorized venues |
| Apply prompt-injection defenses | Complete | Fixed instructions, input cap, DATA/question separation, and text-only rendering are covered statically; the configured live model blocked prompt extraction and handled missing/stale data on 2026-07-18 |
| Connect `CopilotPanel` to API | Complete | Panel posts questions and consumes the SSE stream |
| Show grounding indicator | Complete | Metadata and final grounding summary are rendered on assistant messages |
| Log copilot exchanges | Complete in code, persistence verification remains | The post-stream service-role insert checks returned errors and logs failures without converting a completed answer into a client failure. Successful hosted persistence is not yet verified |

### Phase 6 — Resource Allocation Advisor

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Derive staffing suggestions from current/predicted occupancy | Complete in code, verification remains | The protected advisor projects occupancy from two timestamped samples, includes available volunteer context, and produces bounded human-reviewed actions; verify the hosted model and fallback paths |
| Constrain recommendations to structured JSON | Complete | Fireworks JSON-schema output, runtime parsing, authorized-zone validation, typed evidence/limitations, and deterministic fallback contracts are implemented and tested |
| Refresh advisor panel with live data | Complete in code, verification remains | The Ops panel loads on entry, debounces each telemetry tick into one refresh, rate-limits generation, and supports manual retry; verify hosted Realtime behavior and model cost |

### Phase 7 — Security hardening

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Rate-limit copilot and simulation APIs | Complete | Migration `0006` is applied; atomic exhaustion and route-level 429 behavior are verified, and all limits are consumed before paid or privileged work |
| Top-level React error boundary | Complete | App-level and global boundaries provide safe retry states, state that no operational action occurred, and keep stack details out of the browser |
| Adversarial prompt-injection test | Complete | Static contracts pass and `verify:prompt-injection-live` confirmed no protected prompt disclosure, preserved output structure, and safe missing/stale behavior against the configured live model |
| Verify RLS on every live table | Complete for current schema | Applied migrations enable RLS on every documented table; live role reads, anonymous denial, cross-role write denial, authorized writes, and server-only limiter access were verified on 2026-07-18 |
| Audit git history for secrets | Complete for current history | Every revision was scanned without printing content for common Anthropic, OpenAI, Supabase, and JWT secret signatures; no matches were found. Re-run immediately before submission |
| Confirm `.env*` ignored throughout history | Partial | No `.env*` file appears in tracked history, but the root commit did not yet contain the `.env*` ignore rule, so the stricter doc-07 wording "gitignored from the first commit" is not satisfied |
| Attempt cross-role access violations | Complete | `verify:p0-hosted` confirmed unauthorized alert/volunteer writes return no rows while permitted writes succeed; deployed four-role navigation and API checks also pass |
| Add GitHub Actions verification workflow | Complete | The current `main` revision `c7ebfa2` passed the pushed CI workflow on 2026-07-19, including lint, TypeScript, tests, prompt contracts, and the production build |
| Protect privileged service-role routes | Complete | Local route integration against hosted services returned 401 without credentials, 200 with the cron bearer secret, and 429 after exhaustion; authorization precedes service-role writes and AI calls |
| Move authorization to trusted role source | Complete | Protected `user_roles`, route guards, alert API, and update policies are applied; hosted role, venue-isolation, route, API, and write-policy checks pass |

### Phase 8 — Polish and submission

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Accessibility pass | Partial | Deployed login scored Lighthouse Accessibility 100 and axe WCAG A/AA found 0 violations. Source inspection covers focus, dialog, charts, live regions, non-color context, and reduced motion; authenticated keyboard, screen-reader, contrast, and zoom checks remain |
| Repository size check | Complete for current state | Prospective tracked files including the P0 work total about 583 KB and loose Git objects remain under 1 MB, comfortably below 10 MB; recheck immediately before submission |
| Single-branch check | Complete for current state | Local and remote branch listing contains only `main` (plus `origin/HEAD` pointing to `origin/main`); recheck before submission |
| Submission README | Complete | README documents prerequisites, safe variables, migrations, seeds, role provisioning, commands, architecture, recovery, deterministic demo steps, simulation disclosure, and LinkedIn submission scope |
| State synthetic-data assumption | Complete | README explicitly explains unavailable FIFA telemetry, realistic simulation, and feed-swappable architecture |
| Prepare LinkedIn submission post | Not started | Tracked by SUB-01; a separately recorded video is not treated as required |
| Final push and submission tag | Not started | Current revision `c7ebfa2` is synchronized with `origin/main`. The intentional submission-finalization commit/push/tag remains and requires explicit user authorization |

### P0 — Submission blockers

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P0-01 | done | Restore a clean lint baseline | `npm.cmd run lint` exits successfully with no errors or warnings after typing the AI stream, converting database types to UTF-8, and removing an unused legacy hook |
| P0-02 | done | Make the production build deterministic | Inter and JetBrains Mono are bundled from local npm packages; `npm.cmd run build` and TypeScript pass without a Google Fonts request |
| P0-03 | done | Protect privileged system routes | Cron-secret and trusted-role checks run before privileged work; integration returned 401 without credentials and 200 with the trusted cron secret against hosted services |
| P0-04 | done | Move roles to a trusted source | `0003_user_roles_and_realtime.sql` creates protected `user_roles`; login, layout, proxy, alert API, and update policies no longer authorize from editable metadata |
| P0-05 | done | Complete the automatic alert loop | Isolated live verification passed threshold detection, JSON-schema AI generation, alert insert, and Realtime delivery; each successful tick invokes the same detector directly and open zones are skipped |
| P0-06 | done | Add API rate limiting | Applied durable limiter enforces documented limits; atomic exhaustion and route 429 behavior pass without invoking further privileged work |
| P0-07 | done | Make recommendations auditable | Applied typed columns and UI render action, urgency, evidence, limitations, confidence, source, and snapshot time; live structured AI creation passed |
| P0-08 | done | Create static prompt contract scenarios | `npm.cmd run eval:prompts` verifies five data-status scenarios plus irrelevant-question instructions, DATA/QUESTION injection separation, grounded parsing, and structured fallback behavior without calling the live model |
| P0-09 | done | Create a deterministic demo setup | `npm.cmd run demo:reset` successfully created a live 96% critical scenario with a genuine JSON-schema model recommendation and documented human handling step |
| P0-10 | done | Finish core README setup | README now covers prerequisites, safe variables, migrations/seeds, role provisioning, local verification, architecture, simulation disclosure, recovery, demo flow, and LinkedIn submission scope |
| P0-11 | done | Add reproducible demo seeds | `0002_seed.sql` creates stable venue/zone/gate references and `0004_seed_volunteers.sql` creates fictional volunteer assignments; live application was verified under P0-13 |
| P0-13 | done | Verify the external Supabase demo environment | Migration history matches through applied `0009`. Live checks pass role reads, venue-assignment isolation, anonymous/cross-role denial, authorized writes, durable limits, simulation data, and Realtime telemetry/alert delivery |
| P0-14 | done | Add continuous integration | `.github/workflows/ci.yml` runs install, lint, TypeScript, Node contract tests, static prompt contracts, and the production build on pushes to `main` and pull requests; the current `c7ebfa2` run completed successfully on 2026-07-19 |

### P1 — Judge-visible product value

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P1-01 | in_progress | Resource Allocation Advisor | Structured prediction, schema validation, AI/fallback labeling, evidence, limitations, Realtime refresh, and tests are implemented; verify the hosted role-scoped model flow before marking done |
| P1-02 | done | Gate throughput chart | Ops aggregates timestamped scans into a live trend, identifies the busiest gate, and provides an accessible text equivalent |
| P1-03 | in_progress | Volunteer reassignment | Authenticated API validation and accessible UI are implemented through the session client and existing RLS policy; verify Admin/Coordinator success and cross-role denial in the hosted UI |
| P1-04 | done | Human feedback on AI recommendations | Migration `0008`, the authenticated API, and UI record Accept/Reject separately from Mark handled; all three transitions passed the live Ops RLS policy and the test alert was restored |
| P1-05 | done | Role-flow consistency | Deployed passwordless sessions verified all four page matrices and alert API permissions on 2026-07-18; unauthorized pages redirected to the trusted role default |
| P1-06 | done | Copilot data relevance | The deployed reasoning-disabled configuration returned non-empty grounded answers for all four roles on 2026-07-19; metadata confirmed authorized venue scope and role-specific crowd, sustainability, and volunteer data categories |
| P1-07 | ready | Copilot retention job | Query logs older than the documented retention window are removed by a protected scheduled job and the policy is documented |
| P1-08 | done | Error and empty states | App/global error boundaries and affected dashboard/alert states provide safe retry, error, empty, and degraded messages without stack traces or fabricated data |
| P1-09 | in_progress | Accessibility pass | Lighthouse Accessibility 100 and axe WCAG A/AA 0 violations are recorded for login; manual keyboard, screen-reader, contrast, and zoom evidence on authenticated dashboards remains |
| P1-10 | in_progress | Complete Phase 3 Realtime wiring | Client subscriptions and the hosted publication/event-delivery checks pass; verify visible dashboard changes without refresh before marking done |
| P1-11 | in_progress | Integrate the incident feed into the Ops workflow | Navigation, Realtime refresh, handling, safe states, hosted insert/update, and RLS behavior are implemented and verified; visibly exercise the no-refresh feed workflow before marking done |
| P1-12 | in_progress | Make copilot audit logging reliable | Returned insert errors and thrown logging exceptions are recorded server-side without breaking the completed user stream. Verify successful hosted persistence; retention remains tracked by P1-07 |
| P1-13 | done | Run live-model adversarial Copilot evaluation | `verify:prompt-injection-live` passed injection, missing-data, and stale-data scenarios against Kimi K2.6 on 2026-07-18 without revealing protected prompt text or inventing current facts |
| P1-14 | in_progress | Sustainability intervention advisor | Role-scoped structured AI/fallback interventions, evidence, limitations, target semantics, Realtime refresh, and manual retry are implemented; verify Admin/Sustainability Lead hosted behavior before marking done |
| P1-15 | in_progress | Passwordless judge role chooser | Production variables are configured and hosted verification established correct sessions, redirects, page access, and API permissions for all four fixed roles on 2026-07-19; manually click each login-page role button before marking done |

### P2 — Polish and scale narrative

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P2-01 | ready | Admin venue drill-down | Admin can open a venue-specific operational view without losing venue scope |
| P2-02 | ready | Multi-venue comparison | Admin can compare the small set of metrics needed for cross-venue decisions |
| P2-03 | ready | Match summary export | A grounded end-of-match summary clearly separates measured facts from generated analysis |
| P2-04 | ready | Telemetry retention/rollups | Old raw telemetry is safely summarized or purged according to a documented storage policy |
| P2-05 | ready | Observability upgrade | Structured logs include safe request context; production monitoring recommendations are documented without exposing secrets or user questions |
| P2-06 | done | Migrate middleware convention | `src/proxy.ts` exports `proxy` with the existing matcher, Supabase cookie refresh, authentication redirects, and role guards; TypeScript, lint, and the production build pass without the deprecation warning |

## Current verification

On 2026-07-19, the pushed GitHub Actions workflow for current revision `c7ebfa2`
passed. Lint, TypeScript, thirteen auth/API/Copilot/advisor contract tests,
the static prompt contract evaluation, and the production build all pass. The
non-mutating public smoke test also passes login-shell, protected-route, and
protected-API checks against `stadiumpulse-ai-nine.vercel.app`. The build uses
local font packages, makes no Google Fonts request, and no longer reports the
middleware convention deprecation.
The hosted submission check established passwordless sessions for all four
roles, passed the documented page/API authorization matrix, and returned
non-empty role-scoped Copilot answers. The Admin injection probe did not expose
protected prompt text.
Hosted verification after applying migration `0009` passes venue-assignment
isolation, cross-role write denial, authorized writes, query isolation, durable
rate limiting, and Realtime delivery. Deployed route verification passes the
public shell, authentication boundary, four-role page matrix, and alert API
permissions.
`npm.cmd audit --omit=dev` reports zero known
vulnerabilities after a narrow PostCSS 8.5.10 override for the advisory in
Next.js 16.2.10's transitive dependency.
The concise evidence table is recorded in `docs/09_verification_report.md`.

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

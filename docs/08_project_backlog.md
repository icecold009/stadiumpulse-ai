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
| Configure deployed/local trigger | Complete and production-verified | Vercel lists the daily simulation and retention cron jobs, confirms the sensitive `CRON_SECRET` for Production, and a manually triggered production simulation cron returned 2xx on 2026-07-19; Admin/Ops polling supplies bounded active-demo ticks |
| Confirm rows land in Supabase | Complete | Live role verification on 2026-07-18 confirmed populated telemetry tables: 1,995 zone rows, 1,640 gate-scan rows, and 2,124 sustainability rows |

### Phase 3 — Core dashboards

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Replace four placeholder dashboards | Complete for Phase 3 | Overview, Ops, Sustainability, and Volunteer views read real data; gate throughput is implemented and the unsupported advisor placeholder is removed until Phase 6 |
| Wire Realtime dashboard updates | Complete | Authenticated hosted subscribers received zone, gate, sustainability, volunteer, and alert changes; tested reducers update the dashboard state without refresh |
| Confirm role-appropriate dashboard UX | Complete | Passwordless sessions for all four deployed roles reached only their documented pages; cross-role pages redirected to the trusted default |

### Phase 4 — Alerts

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Implement threshold and duplicate prevention | Complete | Shared detection applies warning/critical thresholds, skips open-alert zones, bounds creation to three alerts/run, and is invoked directly by each successful tick |
| Generate one cached AI recommendation | Complete | Alert creation uses Fireworks JSON-schema output and stores typed audit fields once; invalid/unavailable AI is explicitly labeled as a deterministic safety fallback |
| Build incident feed | Complete | `/ops/alerts` is linked for Admin/Ops and includes safe states; an authenticated hosted Ops subscription received both a temporary alert insert and its handled update, and the row was removed afterward |
| Mark alert handled through user session | Complete | PATCH authenticates the user and updates through the session client; live Ops handling plus cross-role RLS denial passed on 2026-07-18 |

### Phase 5 — AI copilot

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Fetch context, call model, and stream | Complete | The deployed route returned non-empty grounded streams for all four roles on 2026-07-19. Ops received crowd/alert context, Sustainability received metric context, Volunteer received assignment context, and Admin received the combined authorized slice, all limited to authorized venues |
| Apply prompt-injection defenses | Complete | Fixed instructions, input cap, DATA/question separation, and text-only rendering are covered statically; the configured live model blocked prompt extraction and handled missing/stale data on 2026-07-18 |
| Connect `CopilotPanel` to API | Complete | Panel posts questions and consumes the SSE stream |
| Show grounding indicator | Complete | Metadata and final grounding summary are rendered on assistant messages |
| Log copilot exchanges | Complete | A hosted Copilot response persisted its question, answer, and grounding summary; the verification row was then removed. Logging failures remain isolated from completed streams |

### Phase 6 — Resource Allocation Advisor

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Derive staffing suggestions from current/predicted occupancy | Complete | The hosted role-scoped advisor returned validated auditable output for Admin and Operations Manager and denied both unrelated roles |
| Constrain recommendations to structured JSON | Complete | Fireworks JSON-schema output, runtime parsing, authorized-zone validation, typed evidence/limitations, and deterministic fallback contracts are implemented and tested |
| Refresh advisor panel with live data | Complete | The panel loads on entry, debounces telemetry ticks, rate-limits generation, and supports retry; hosted telemetry delivery and live advisor generation pass |

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
| Accessibility pass | Complete | Login scored Lighthouse Accessibility 100 and axe WCAG A/AA found 0 violations. A focused authenticated Browser review covered all five Admin routes, accessible structure and names, chart summaries, focus/reflow implementation, and contrast; the low-contrast AI, critical-status, and energy-series labels found during the review were corrected |
| Repository size check | Complete for current state | Tracked files total about 735 KiB, no tracked file exceeds 1 MiB, and loose Git objects remain under 1 MiB, comfortably below 10 MB (rechecked 2026-07-19) |
| Single-branch check | Complete for current state | Local and remote branch listing contains only `main` (plus `origin/HEAD` pointing to `origin/main`); recheck before submission |
| Submission README | Complete | README documents prerequisites, safe variables, migrations, seeds, role provisioning, commands, architecture, recovery, deterministic demo steps, simulation disclosure, and LinkedIn submission scope |
| State synthetic-data assumption | Complete | README explicitly explains unavailable FIFA telemetry, realistic simulation, and feed-swappable architecture |
| Prepare LinkedIn submission post | Not started | Tracked by SUB-01; a separately recorded video is not treated as required |
| Final push and submission tag | Complete | Final submission audits and hosted evidence are published on `main` and tagged `prompt-wars-2026-submission` |

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
| P1-01 | done | Resource Allocation Advisor | Hosted Admin/Ops requests returned schema-valid, bounded, auditable advice after a fresh simulated snapshot; Sustainability/Volunteer requests were denied |
| P1-02 | done | Gate throughput chart | Ops aggregates timestamped scans into a live trend, identifies the busiest gate, and provides an accessible text equivalent |
| P1-03 | done | Volunteer reassignment | Hosted Admin and Volunteer Coordinator updates succeeded, unrelated roles were denied without disclosing rows, the authenticated subscriber received the change, and the volunteer was restored |
| P1-04 | done | Human feedback on AI recommendations | Migration `0008`, the authenticated API, and UI record Accept/Reject separately from Mark handled; all three transitions passed the live Ops RLS policy and the test alert was restored |
| P1-05 | done | Role-flow consistency | Deployed passwordless sessions verified all four page matrices and alert API permissions on 2026-07-18; unauthorized pages redirected to the trusted role default |
| P1-06 | done | Copilot data relevance | The deployed reasoning-disabled configuration returned non-empty grounded answers for all four roles on 2026-07-19; metadata confirmed authorized venue scope and role-specific crowd, sustainability, and volunteer data categories |
| P1-07 | done | Copilot retention job | A cron-secret-protected daily route deletes rows older than 24 hours; local production-route verification deleted a 25-hour row, preserved a recent row, denied unauthenticated access, and cleaned up |
| P1-08 | done | Error and empty states | App/global error boundaries and affected dashboard/alert states provide safe retry, error, empty, and degraded messages without stack traces or fabricated data |
| P1-09 | done | Accessibility pass | Lighthouse Accessibility 100 and axe WCAG A/AA 0 violations are recorded for login; a focused authenticated Browser review covered all five Admin routes and drove AA contrast fixes for AI labels, critical badges, and the energy chart series, plus a single-page-heading cleanup |
| P1-10 | done | Complete Phase 3 Realtime wiring | Hosted authenticated subscriptions received zone, gate, sustainability, volunteer, and alert changes; shared tested reducers merge those payloads into bounded dashboard state without refresh |
| P1-11 | done | Integrate the incident feed into the Ops workflow | Navigation and safe states are implemented; hosted Ops received a test alert insert and handled update over Realtime, and the verification row was removed |
| P1-12 | done | Make copilot audit logging reliable | Hosted persistence recorded the question, non-empty answer, and grounding summary; error paths remain server-logged without breaking completed streams, and retention is implemented under P1-07 |
| P1-13 | done | Run live-model adversarial Copilot evaluation | `verify:prompt-injection-live` passed injection, missing-data, and stale-data scenarios against Kimi K2.6 on 2026-07-18 without revealing protected prompt text or inventing current facts |
| P1-14 | done | Sustainability intervention advisor | Hosted Admin/Sustainability Lead requests returned schema-valid evidence and limitations after a fresh snapshot; Ops/Volunteer requests were denied |
| P1-15 | done | Passwordless judge role chooser | The deployed login renders all four role choices; each selection endpoint established the correct normal session, redirect, page matrix, and API permissions |

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

On 2026-07-19, the pushed GitHub Actions workflow for deployed revision `c7ebfa2`
passed. The current P1 work passes lint, TypeScript, seventeen
auth/API/Copilot/advisor/Realtime/retention contract tests,
the static prompt contract evaluation, and the production build all pass. The
non-mutating public smoke test also passes login-shell, protected-route, and
protected-API checks against `stadiumpulse-ai-nine.vercel.app`. The build uses
local font packages, makes no Google Fonts request, and no longer reports the
middleware convention deprecation.
Vercel lists both committed production cron schedules. The sensitive
`CRON_SECRET` exists for Production, and a manual simulation-cron invocation at
2026-07-19T09:35:01Z appeared in the production 2xx request logs.
The final public smoke test and authenticated four-role interaction harness
passed again at 2026-07-19T10:59:36Z. Every allowed page returned 200, forbidden
pages redirected safely, alert permissions matched the role matrix, all four
Copilot streams returned non-empty role-scoped answers, and the injection probe
passed. A refreshed deterministic scenario supplied current telemetry to the
Admin and Operations Manager flows.
The hosted submission check established passwordless sessions for all four
roles, passed the documented page/API authorization matrix, and returned
non-empty role-scoped Copilot answers. The Admin injection probe did not expose
protected prompt text.
`verify:p1-hosted` also passed both role-scoped advisors, cross-role denials,
all Phase 3 Realtime tables, Admin/Coordinator reassignment with restoration,
incident insert/handling, and Copilot persistence with cleanup. The protected
retention route passed locally against hosted Supabase test rows.
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
| SUB-02 | done | Final security audit | Every applicable checkbox in doc 07 is verified and results are recorded; the historical root-commit `.gitignore` exception is explicitly disclosed |
| SUB-03 | done | Repository audit | Public access returned HTTP 200; single-branch, size, secrets, setup, licensing/assets, Git integrity, and nine ordered migrations were checked on 2026-07-19. No project license is granted and no separately sourced media assets are included |
| SUB-04 | done | Final publish and tag | The verified submission state is published on `main` and tagged `prompt-wars-2026-submission` |

## Completed planning work

| ID | Status | Work | Verification |
|---|---|---|---|
| PLAN-01 | done | Align PRD and implementation plan to the Prompt Wars stadium challenge | Docs 01, 02, and 06 contain challenge alignment, GenAI contract, critical path, and submission package |
| PLAN-02 | done | Establish agent guidance and a persistent backlog | Root `AGENTS.md`, `docs/README.md`, and this backlog exist and are linked |
| PLAN-03 | done | Audit consolidated checklist Phases 0–8 against the repository | Phase audit above records complete, partial, unverified, and missing work; remaining items map to P0/P1/P2 and submission backlog entries |

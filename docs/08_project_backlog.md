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

Deliver one reliable Prompt Wars demo loop:

`simulation -> capacity alert -> grounded recommendation -> operator handles alert`

## Phase 0–5 implementation audit

Audited against the consolidated implementation checklist and repository state
on 2026-07-18. `Complete` means the implementation exists in the repository;
it does not claim that an external Supabase or Vercel environment was manually
verified. External-only facts are explicitly marked `Verify externally`.

### Phase 0 — Pre-flight

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Create the real Supabase project | Verify externally | A local `.env.local` exists, but the existence and health of the remote project cannot be proven from git |
| Apply `0001_init.sql` | Partial | Migration exists with all documented tables, indexes, RLS, and policies; remote application must be verified |
| Seed venues, zones, and gates | Partial | `0002_seed.sql` provides deterministic, repeatable reference rows for two synthetic venues, twelve zones, and eleven gates, but the migration is not committed yet |
| Configure Supabase URL and anon key | Verify externally | Variable values must not be inspected or committed; validate through a safe connection/setup check |
| Configure service-role key | Verify externally | Required variable is documented, and the server client consumes it; deployment/local presence must be validated safely |
| Add checked-in environment example | Complete | The checked-in environment template lists the required Supabase and AI variable names without secret values |
| Build privileged Supabase client | Complete | `src/lib/supabase/service-role.ts` creates a non-persistent server-only service-role client |

### Phase 1 — Auth and routing

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Real email/password login | Complete | Login calls `signInWithPassword` and routes after success |
| Session and role route guard | Complete, hardening remains | Middleware and dashboard layout verify the session and redirect; trusted-role migration remains under P0-04 |
| Pass real role to `RoleNav` | Complete | Dashboard layout derives the role from the authenticated user and passes it to role-filtered navigation |
| Create four demo users | Verify externally | Supabase Auth users are external state and no safe verification record exists in the repo |
| Configure demo-user roles | Verify externally, design change planned | Current code/RLS expects `user_metadata.role`; P0-04 moves authorization to trusted server-managed claims |

### Phase 2 — Data simulation

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Implement `/api/simulate-tick` | Complete, security remains | Route generates and bulk-inserts all three telemetry categories through the service-role client; P0-03 must protect it |
| Generate coherent match-phase values | Complete | Pre-kickoff, in-play, and post-match phases drive occupancy, scans, and sustainability load with bounded jitter |
| Configure deployed/local trigger | Complete, security remains | `vercel.json` schedules a minute cron and `DashboardPoller` triggers local/demo ticks; both depend on P0-03 protection design |
| Confirm rows land in Supabase | Verify externally | Requires a live tick plus safe database/table verification against the configured project |

### Phase 3 — Core dashboards

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Replace four placeholder dashboards | Partial | Overview, Ops, and Sustainability read real data; Volunteer view is summary-only, while gate throughput and resource advisor remain placeholders |
| Wire Realtime dashboard updates | Partial | Zone heatmap subscribes to telemetry; alert and volunteer hooks exist but are not integrated into their pages, and sustainability/trend metrics remain initial-load data |
| Confirm role-appropriate dashboard UX | Partial | Navigation filters by role, but route access and documented role flows are inconsistent and require manual four-role verification |

### Phase 4 — Alerts

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Implement threshold and duplicate prevention | Complete, integration remains | `/api/check-alerts` implements warning/critical thresholds and skips zones with open alerts; it is unprotected and not invoked by the scheduled tick |
| Generate one cached AI recommendation | Complete | Alert creation calls the model once and stores the result, with a deterministic fallback |
| Build incident feed | Partial | A functional polling feed exists at `/ops/alerts`, but it is not linked from role navigation or embedded in Ops and does not use the Realtime alert hook |
| Mark alert handled through user session | Complete, external RLS verification remains | PATCH authenticates the user and updates through the session client; the database policy must still be tested with all roles |

### Phase 5 — AI copilot

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Fetch context, call model, and stream | Partial | Authenticated streaming works over a 15-minute data slice, but the slice is not venue/role scoped and DATA plus QUESTION share one user-message string |
| Apply prompt-injection defenses | Partial | Fixed system instructions, input length cap, JSON data labeling, and text rendering exist; adversarial evaluation and clearer message/content separation remain |
| Connect `CopilotPanel` to API | Complete | Panel posts questions and consumes the SSE stream |
| Show grounding indicator | Complete | Metadata and final grounding summary are rendered on assistant messages |
| Log copilot exchanges | Complete, reliability verification remains | Service-role insert exists after streaming; insert errors are not surfaced or logged, and live persistence is not verified |

### Phase 6 — Resource Allocation Advisor

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Derive staffing suggestions from current/predicted occupancy | Not started | Ops contains explanatory placeholder text only; implement under P1-01 |
| Constrain recommendations to structured JSON | Not started | No advisor schema, validation, or structured-output prompt exists |
| Refresh advisor panel with live data | Not started | No advisor API/function or live panel is connected to simulation/telemetry updates |

### Phase 7 — Security hardening

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Rate-limit copilot and simulation APIs | Not started | A 429 AI-provider error message exists, but there is no application-level limiter |
| Top-level React error boundary | Not started | No `error.tsx` or `global-error.tsx` exists under `src/app` |
| Adversarial prompt-injection test | Not started | Prompt defenses exist in code, but no committed test/harness or recorded verification exists |
| Verify RLS on every live table | Partial | Migration enables RLS on all documented tables; live project state requires external verification |
| Audit git history for secrets | Not verified | Must be performed without printing secret values and recorded in the final security audit |
| Confirm `.env*` ignored throughout history | Partial | Current `.gitignore` ignores `.env*`; historical verification remains |
| Attempt cross-role access violations | Not started | Requires the four live demo users and manual/API authorization checks |
| Add GitHub Actions lint/typecheck workflow | Not started | No `.github` workflow exists |
| Protect privileged service-role routes | Not started | Simulation and alert-check endpoints remain callable without user or cron authorization |
| Move authorization to trusted role claims | Not started | Middleware, layout, login routing, and RLS currently depend on user metadata |

### Phase 8 — Polish and submission

| Step | Status | Evidence or remaining condition |
|---|---|---|
| Accessibility pass | Partial | Components include several labels and focus styles, but no recorded keyboard, screen-reader, contrast, chart-summary, or reduced-motion audit exists |
| Repository size check | Complete for current state | Tracked files total about 485 KB and loose git objects about 230 KB, comfortably below 10 MB; recheck immediately before submission |
| Single-branch check | Complete for current state | Local and remote branch listing contains only `main` (plus `origin/HEAD` pointing to `origin/main`); recheck before submission |
| Submission README | Partial | Challenge pitch, stack, synthetic-data rationale, and docs links exist; setup, environment, migration/seed, demo-user, run, and demo instructions remain under P0-10 |
| State synthetic-data assumption | Complete | README explicitly explains unavailable FIFA telemetry, realistic simulation, and feed-swappable architecture |
| Record demo walkthrough | Not started | Tracked by SUB-03 |
| Final push and submission tag | Not started | Perform only after all audits pass and the user explicitly requests publication actions |

### P0 — Submission blockers

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P0-01 | ready | Restore a clean lint baseline | `npm.cmd run lint` exits successfully; warnings are either fixed or intentionally documented |
| P0-02 | ready | Make the production build deterministic | `npm.cmd run build` succeeds without relying on a runtime Google Fonts download; TypeScript continues to pass |
| P0-03 | ready | Protect privileged system routes | Simulation and alert-check routes require an authenticated server/cron secret; unauthorized requests return 401/403 and never create service-role writes or AI calls |
| P0-04 | ready | Move roles to trusted claims | Route guards, server handlers, and RLS use server-managed `app_metadata` or an equivalent trusted claim; users cannot modify their own authorization role |
| P0-05 | ready | Complete the automatic alert loop | Each scheduled tick safely invokes alert detection or both run in one protected job; duplicate open alerts are prevented; the dashboard receives the new alert |
| P0-06 | ready | Add API rate limiting | Copilot users are limited to the documented request rate and simulation calls are bounded appropriately for authenticated/manual use; excess requests return a friendly 429 without invoking paid or privileged work |
| P0-07 | ready | Make recommendations auditable | Operational recommendation output includes action, urgency, evidence, limitations/confidence, and snapshot time; UI renders it without parsing arbitrary prose |
| P0-08 | ready | Create prompt evaluation scenarios | Tests or a repeatable harness cover normal, warning, critical, stale/missing data, irrelevant request, and injection cases with behavior-based expectations |
| P0-09 | ready | Create a deterministic demo setup | One documented command or protected action seeds/resets a coherent scenario that reaches the alert-to-action loop reliably |
| P0-10 | ready | Finish core README setup | README documents prerequisites, safe environment-variable names, Supabase migration/seed steps, local commands, demo accounts strategy, simulation disclosure, and architecture |
| P0-11 | in_progress | Add reproducible reference seeds | `0002_seed.sql` idempotently creates stable venues, zones, and gates with fixed UUID relationships; commit it, then verify live application under P0-13 |
| P0-13 | ready | Verify the external Supabase demo environment | Migration version, seed rows, Realtime publication, four demo accounts, trusted roles, and successful simulator inserts are checked without exposing secrets; results are recorded in setup/submission notes |
| P0-14 | ready | Add continuous integration | A GitHub Actions workflow runs lint and TypeScript checks on pushes to `main`; failures are visible and the documented commands match local verification |

### P1 — Judge-visible product value

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| P1-01 | ready | Resource Allocation Advisor | Current occupancy produces structured staffing recommendations with evidence; the panel handles unavailable AI or data honestly |
| P1-02 | ready | Gate throughput chart | Ops dashboard plots timestamped gate scans over the intended time window with an accessible text summary |
| P1-03 | ready | Volunteer reassignment | Authorized coordinators/admins can reassign a volunteer; RLS enforces the action and Realtime updates the view |
| P1-04 | ready | Human feedback on AI recommendations | Operator can accept, reject, or mark handled; the recorded state clearly distinguishes recommendation from executed action |
| P1-05 | ready | Role-flow consistency | Login redirects, navigation visibility, middleware/proxy rules, page authorization, API authorization, and documented role access agree |
| P1-06 | ready | Copilot data relevance | The server selects only role- and venue-relevant current data, detects stale snapshots, and exposes the exact evidence summary to the user |
| P1-07 | ready | Copilot retention job | Query logs older than the documented retention window are removed by a protected scheduled job and the policy is documented |
| P1-08 | ready | Error and empty states | Top-level error boundary and affected screens show safe, useful messages without stack traces or fabricated fallback data |
| P1-09 | ready | Accessibility pass | Keyboard flow, visible focus, chart summaries, non-color status cues, contrast, and reduced-motion behavior meet the UI brief |
| P1-10 | ready | Complete Phase 3 Realtime wiring | Ops metrics/alerts, sustainability metrics, and volunteer state update from Supabase changes without a page reload; unused duplicate hooks are removed or intentionally consolidated |
| P1-11 | ready | Integrate the incident feed into the Ops workflow | Authorized users can discover the feed from navigation or Ops, new alerts appear live, handled alerts disappear/update live, and safe loading/error/empty states are present |
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

## Known lint cleanup detail for P0-01

The latest repository check found the following areas. Re-run lint before work
because line numbers and errors may change:

- Untyped AI stream event in `src/app/api/copilot/route.ts`
- Render-time `Date.now()` in `src/components/dashboard/trend-line.tsx`
- Synchronous state mirroring inside effects in the three Realtime hooks
- `let` that can be `const` in `src/middleware.ts`
- `src/types/database.ts` detected as binary by ESLint, likely an encoding issue
- Unused alert loader and login role redirect map
- Missing effect dependencies in `src/hooks/useSupabaseRealtime.js`

## Prompt Wars submission work

| ID | Status | Work | Acceptance criteria |
|---|---|---|---|
| SUB-01 | ready | Build-process evidence | Genuine Google Antigravity usage evidence is collected according to current organizer requirements; the repo does not fabricate or imply evidence |
| SUB-02 | ready | Narrative submission | Narrative explains the user problem, prompt iterations, grounding, safeguards, demonstrated impact, limitations, and scale path |
| SUB-03 | ready | Three-minute demo | Recorded/rehearsed flow follows the sequence in doc 06 and completes the alert-to-action loop without manual database repair |
| SUB-04 | ready | Final security audit | Every checkbox in doc 07 is verified and results are recorded |
| SUB-05 | ready | Repository audit | Public repository, branch, size, secrets, setup instructions, licensing/assets, and reproducible migrations are checked before submission |
| SUB-06 | ready | Final publish and tag | After explicit user authorization, the verified final state is committed, pushed to `main`, and tagged with the agreed submission tag |

## Completed planning work

| ID | Status | Work | Verification |
|---|---|---|---|
| PLAN-01 | done | Align PRD and implementation plan to the Prompt Wars stadium challenge | Docs 01, 02, and 06 contain challenge alignment, GenAI contract, critical path, and submission package |
| PLAN-02 | done | Establish agent guidance and a persistent backlog | Root `AGENTS.md`, `docs/README.md`, and this backlog exist and are linked |
| PLAN-03 | done | Audit consolidated checklist Phases 0–8 against the repository | Phase audit above records complete, partial, unverified, and missing work; remaining items map to P0/P1/P2 and submission backlog entries |

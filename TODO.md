# Final Luna plan — StadiumPulse AI

Repository: `C:\Users\91829\OneDrive\Documents\GitHub\stadiumpulse-ai`
Reviewed: clean `main` at `e679b12` on 2026-08-25
Feature branch: `codex/luna-pulseops-refresh-evidence`

Tracker ownership: `docs/08_project_backlog.md` remains the repository's single mutable source of truth. Keep it synchronized with every status change made while executing this plan.

## Current verified baseline

- ESLint, 24 Node tests, and Next.js 16.2.10 production build pass.
- Feedback actions now use safe catch/finally paths.
- The keyboard shortcut dispatches one refresh event rather than mixing a router refresh with a custom refresh.
- Hosted/authenticated claims in repository notes must be reverified; no hosted check was run in this review.

## Code-review conclusion

Snapshot and alert refreshes can overlap through filters, shortcuts, and Realtime. Neither path aborts prior requests or rejects late responses, so older data can overwrite newer data. The alert list also assumes JSON on normal loads. Fix refresh ordering before adding more dashboard polish.

## Build checklist

- [ ] **1. Reconcile backlog and branch scope**
  Files: `AGENTS.md`, `docs/README.md`, `docs/08_project_backlog.md`, relevant plans.
  What to build: Mark already completed feedback/refresh work accurately and define this branch as refresh ordering plus evidence, not a broad revamp.
  Acceptance: Backlog, code, and known-current-state claims agree and unverified hosted claims are labelled.
  Verify: Run current lint, tests, TypeScript, and build baseline.

- [ ] **2. Centralize request-safe refresh behavior**
  Files: ops snapshot and alerts client components, a small shared fetch helper if justified.
  What to build: Add AbortController/request identity, safe non-JSON parsing, in-flight semantics, and mounted cleanup. Decide whether repeated refresh coalesces or supersedes.
  Acceptance: Late snapshot/alert responses never overwrite current filter/venue state; unmount causes no state update.
  Verify: Unit tests with intentionally reordered and malformed responses.

- [ ] **3. Make freshness and refresh outcomes explicit**
  Files: command center, alert page, freshness badge.
  What to build: Show last successful refresh, refreshing, stale, partial, and failed while retaining last good data. Do not imply realtime before subscription evidence.
  Acceptance: A failed refresh does not blank valid prior data or update the freshness timestamp.
  Verify: Component tests for first failure, later failure, successful retry, stale threshold, and Realtime-triggered coalescing.

- [ ] **4. Finish action-specific operator recovery**
  Files: alert actions and grounded recommendation components.
  What to build: Keep error/success adjacent to the acted-on alert, prevent duplicate action submits, retain selection/context, and preserve the original recommendation across edits/overrides.
  Acceptance: Unauthorized, duplicate, rate-limited, non-JSON, network, and successful retry states are distinguishable and auditable.
  Verify: Route/component tests for every action outcome.

- [ ] **5. Run accessibility and scale checks**
  Files: browser harness and any focused UI fixes.
  What to build: Verify keyboard shortcuts help, focus after refresh/action, alert text summaries, no color-only status, narrow layout, reduced motion, long alert lists, and streaming Copilot status.
  Acceptance: The primary acknowledge/escalate action remains usable and status announcements are not noisy.
  Verify: Automated accessibility tree/contrast plus manual keyboard, 200% zoom, and screen-reader checks.

- [ ] **6. Reverify authenticated hosted roles**
  Files: existing verification scripts and private evidence notes.
  What to build: Run operator, supervisor, admin, volunteer, and unauthorized matrices against the intended app URL and venue-scoped data; verify alert mutation, audit persistence, Realtime, and failure recovery.
  Acceptance: No secret is printed or committed; simulated vs real-provider behavior remains labelled.
  Verify: Existing `verify:roles`, `verify:p0-hosted`, relevant P1/alert-loop scripts, and recorded commit/date/environment.

- [ ] **7. Final local and handoff gate**
  Acceptance: Backlog reflects completed, blocked, and deferred items with exact evidence.
  Verify: `npm.cmd run lint`; `npm.cmd test`; `npx.cmd tsc --noEmit`; `npm.cmd run build`; `git diff --check`.

## Commit checkpoints

1. `fix(ops): make dashboard refresh request-order safe`
2. `test(ops): cover refresh freshness and action recovery`
3. `docs(ops): reconcile hosted evidence and backlog`

## Definition of done

- [ ] Concurrent refreshes cannot apply stale data.
- [ ] Every action and refresh has truthful, accessible settled states.
- [ ] Local and hosted role evidence is current and separately reported.
- [ ] Backlog and known-current-state notes match verified reality.
- [ ] Feature branch is pushed and clean; `main` is untouched and unmerged.


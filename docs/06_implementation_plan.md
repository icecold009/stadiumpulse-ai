# 06 · Implementation Plan (build sequence)

Work top to bottom. Commit after each numbered step (small, working
commits to `main` — no branches). Each step should leave the app in a
deployable state.

## Phase 1 — Foundations (Day 1 morning)
1. Complete `00-initial-setup-guide.md` end to end.
2. Scaffold Next.js (App Router, TS) + Tailwind + shadcn/ui via
   `create-next-app`. Push, confirm Vercel auto-deploy.
3. Apply base Supabase schema (`venues`, `zones`, `gates` — the static
   reference tables) via a migration file. Seed 1–2 venues, a handful of
   zones/gates manually (small enough to script, not to hand-import a file).
4. Wire Supabase Auth: login screen, role stored in user metadata, route
   guard component that redirects by role.

## Phase 2 — Data simulation (Day 1 afternoon)
5. Build `/api/simulate-tick` Route Handler: writes plausible
   `zone_telemetry`, `gate_scans`, `sustainability_metrics` rows with
   realistic randomized-but-coherent values (e.g., occupancy trends upward
   pre-kickoff, plateaus, declines post-match).
6. Trigger it via Vercel Cron (e.g., every 60s) or a simple client poll for
   demo purposes if Cron setup takes too long.
7. Confirm data lands in Supabase and is visible via the table editor.

## Phase 3 — Core dashboard (Day 1 evening – Day 2 morning)
8. Build `ZoneHeatmapCell` + `MetricGauge` + `TrendLine` components (per
   UI/UX brief).
9. Build Ops Dashboard screen, wire to Supabase Realtime subscription on
   `zone_telemetry` and `gate_scans`.
10. Build Sustainability Dashboard, same pattern against
    `sustainability_metrics`.
11. Build Volunteer Deployment View against `volunteers`.
12. Build Global Overview (Admin) aggregating across venues.

## Phase 4 — Alerts (Day 2 midday)
13. Add threshold-check logic inside `/api/simulate-tick` (or a separate
    `/api/check-alerts` function): if occupancy > 90% of zone capacity and
    no open alert exists for that zone, create one.
14. On alert creation, call the LLM once to draft `ai_recommendation` (short,
    cached at creation — not regenerated per view).
15. Build `AlertCard`, incident feed, "mark handled" action with RLS-safe
    update (only the assigned role can handle).

## Phase 5 — AI Copilot (Day 2 afternoon)
16. Build `/api/copilot` Route Handler: accepts a question, pulls the
    relevant data slice (last 15 min per venue the user has access to),
    constructs a system prompt with data injected as JSON, calls Claude,
    streams response back.
17. **Apply prompt-injection defenses here** (see Security Plan §
    "Prompt Injection") — this is the highest-risk surface in the app.
18. Build chat UI (slide-over panel), streaming render, "grounded in"
    footer showing which data was used.
19. Log each exchange to `copilot_queries` (for auditability + the nightly
    purge job).

## Phase 6 — Resource Allocation Advisor (Day 2 evening)
20. Build a function that takes current + short-term-predicted occupancy
    per zone and prompts the LLM for staffing suggestions in a constrained
    JSON output format (not freeform prose) so the UI can render it as
    structured cards reliably.
21. Surface as a panel on the Ops Dashboard, refreshed each tick.

## Phase 7 — Hardening pass (Day 3 morning)
22. Walk the full Security Plan checklist (doc 07) top to bottom, item by
    item, fixing gaps.
23. Add basic error boundaries + a lightweight logging call
    (`console.error` is fine at this scale, or Vercel's built-in log
    viewer) so failures are visible without exposing stack traces to users.
24. Test each role's login and confirm they cannot see/act on data outside
    their permissions (manually flip roles and try to break it).

## Phase 8 — Polish & submission (Day 3 afternoon)
25. Accessibility pass: keyboard-only walkthrough, screen reader spot-check,
    contrast check.
26. Write the README (vertical, approach, how it works, assumptions —
    per the challenge's submission requirements).
27. Final repo size check: `du -sh .git` and `du -sh .` — confirm under
    10MB, confirm single branch (`git branch -a` should show only `main`).
28. Record demo walkthrough per the submission doc's requirements.
29. Final push, tag the submission commit.

## Time-box discipline
If a phase is running long, cut scope inside that phase (e.g., skip Global
Overview, skip Volunteer view) rather than skipping the Security hardening
pass — per the evaluation weighting, security and testing are structural,
not decorative.
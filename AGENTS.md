# PulseOps Codex Guide

This file is the operating guide for coding agents working in this repository.
Apply it to the entire repository unless a more specific `AGENTS.md` exists in
a subdirectory.

## Mission

PulseOps (StadiumPulse AI) is a GenAI command center for FIFA World Cup 2026
stadium operations. It converts simulated live telemetry into grounded,
human-approved decisions for organizers, venue staff, and volunteers.

The primary Hack2skill Prompt Wars tracks are:

- Crowd management
- Operational intelligence
- Sustainability
- Real-time decision support

The core product proof is:

`live signal -> detected risk -> grounded GenAI recommendation -> human action`

Preserve this decision loop when prioritizing work. Do not expand into
unrelated fan features until the loop is complete and demo-ready.

## Start here

Before making a material change:

1. Read `docs/README.md` for document routing.
2. Read the relevant numbered documents, especially the PRD, TRD,
   implementation plan, security plan, and backlog.
3. Inspect `git status --short` and preserve unrelated user changes.
4. Confirm the task against `docs/08_project_backlog.md`; update the backlog
   when a tracked item is completed, split, blocked, or intentionally deferred.

## Architecture

- Next.js 16 App Router and TypeScript under `src/app`
- Route Handlers under `src/app/api`; privileged secrets stay server-only
- Supabase Postgres, Auth, RLS, and Realtime
- Database source of truth: `supabase/migrations`
- Generated/manual database types: `src/types/database.ts`
- Tailwind CSS and reusable components under `src/components`
- Anthropic-compatible streaming AI client under `src/lib/ai`
- Synthetic telemetry ingestion: `src/app/api/simulate-tick/route.ts`

Do not introduce a separate backend, state store, vector database, or new
deployment service without a concrete requirement and explicit user approval.

## Security and product invariants

- Never expose service-role or AI keys to client components.
- Never read or print `.env.local` values. Refer only to variable names.
- All privileged routes must authenticate a user or validate a server/cron
  secret before using the service-role client.
- Treat client input, user questions, route parameters, and role claims as
  untrusted.
- Authorization roles belong in trusted server-managed claims such as
  `app_metadata`, not user-editable metadata.
- Keep RLS enabled and default-deny on every public table.
- The AI may recommend actions but must not autonomously execute operational
  actions, SQL, or system commands.
- AI answers must be grounded in a timestamped server-generated data slice,
  cite the evidence used, and clearly state when data is missing or stale.
- Render model output as text. Never evaluate it or use it directly as a query.
- Clearly label all telemetry as simulated in the product and submission.
- Preserve accessibility requirements from `docs/04_ui_ux_design_brief.md`.

## Code conventions

- Prefer server components unless browser state, events, or subscriptions
  require `"use client"`.
- Use the clients in `src/lib/supabase`; do not create ad hoc Supabase clients.
- Keep database writes server-side or constrained by explicit RLS policies.
- Derive TypeScript types from `src/types/database.ts` where practical.
- Keep prompts centralized in `src/lib/ai`; avoid large inline prompt strings
  in UI components.
- Use structured model output for recommendations rendered as cards or actions.
- Do not fabricate fallback metrics or recommendations in the UI. Use an honest
  empty, unavailable, or degraded state.
- Avoid drive-by refactors and preserve the existing visual system.

## Local commands

PowerShell may block `npm.ps1`; use the `.cmd` shims when necessary.

```powershell
npm.cmd run dev
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

The production build may require network access while `next/font` downloads
Google Fonts. A font-download failure alone does not prove application code is
invalid; prefer bundling fonts locally as tracked in the backlog.

## Verification and definition of done

For code changes, verify in proportion to risk. At minimum:

1. Run lint on the changed scope or the full repository.
2. Run `npx.cmd tsc --noEmit`.
3. Run a production build when routes, configuration, dependencies, or server
   and client boundaries change.
4. Manually exercise the affected flow when Supabase, streaming, Realtime,
   role authorization, or human actions are involved.
5. For AI changes, exercise the relevant scenarios from the prompt evaluation
   backlog, including missing data and injection resistance.
6. Update documentation and `docs/08_project_backlog.md` in the same change
   when behavior, architecture, setup, or task status changes.

A feature is not demo-ready until the judge can see its input data, generated
recommendation, evidence, and human-controlled outcome.

## Git and repository hygiene

- Work on `main` unless the user explicitly changes the workflow.
- Do not commit, push, tag, deploy, or open a PR unless explicitly requested.
- Never commit `.env*`, generated build output, logs, or secrets.
- Keep the repository small; do not add datasets, model weights, recordings,
  or large binary assets.
- Use migrations for reproducible schema changes. Do not treat manual Supabase
  dashboard edits as the source of truth.

## Known current state

- TypeScript currently passes.
- Full ESLint currently has known failures tracked in the backlog.
- Gate throughput, resource allocation, volunteer reassignment, rate limiting,
  prompt evaluation, and full submission evidence remain incomplete.
- `middleware.ts` works but Next.js 16 reports that the convention is
  deprecated in favor of `proxy`.

Do not assume these notes remain current: verify and update both this section
and the backlog when the underlying state changes.

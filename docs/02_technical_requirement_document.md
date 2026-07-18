# 02 · Technical Requirement Document (TRD)

## Guiding constraints
1. Repo must stay under 10MB, single-branch. No real datasets, model
   weights, or heavy frameworks in git — data lives in Supabase, not the repo.
2. Solo build, time-boxed hackathon. Fewer moving pieces > theoretically
   "purer" architecture. Every choice below is filtered through "does this
   cost build time without buying judge-visible quality."

## Stack decision

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router, TypeScript)** | One project for frontend *and* backend — Route Handlers replace a separate API server. Fewer deploy targets, fewer config files, faster solo iteration than a split React+FastAPI setup. |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, accessible components out of the box |
| Charts | Recharts | Lightweight, sufficient for heatmaps/line/gauge charts |
| Backend logic | Next.js **Route Handlers** (`src/app/api/**/route.ts`) | Run server-side only, hold all secrets, support streaming responses (needed for the AI copilot) |
| Database | Supabase (Postgres) | Free tier, built-in Auth, built-in Row Level Security — directly answers the "Auth & Permissions" and "Security & RLS" requirements without hand-rolling either |
| Auth | Supabase Auth (email/password + role claim) | No custom session/auth logic to write or audit |
| LLM | Anthropic Claude API (`@anthropic-ai/sdk`) | Called only from Route Handlers, never from the browser |
| Realtime | Supabase Realtime (Postgres change subscriptions) | Push dashboard updates without polling |
| Hosting | Vercel | Native Next.js support, auto-deploy on push to `main`, one deploy target for the whole app |
| CI/CD | GitHub Actions (lint + typecheck on push) + Vercel auto-deploy | Cheap, standard, keeps `main` always deployable |

## Why this over the alternatives considered

- **Vs. Vite + separate serverless functions folder:** functionally similar,
  but Next.js's Route Handlers + App Router give you file-based API routing,
  built-in streaming (`ReadableStream` support) for the copilot, and one
  `next.config` instead of coordinating a separate functions setup —
  strictly less to wire up by hand for the same result.
- **Vs. Python (FastAPI + React, or Streamlit):** would mean two languages
  and two dependency trees for a solo build (FastAPI+React), or a fast but
  visually/structurally limited app that can't cleanly support four
  distinct role-based dashboard views (Streamlit). TypeScript end-to-end
  keeps one mental model and one type system from DB → API → UI.
- **Vs. a separate Express server on Render/Railway:** one more service to
  provision, configure, and keep alive; Vercel + Next.js covers this at
  hackathon scale for free.

## Data simulation service

A Route Handler, `src/app/api/simulate-tick/route.ts`, triggered by a
Vercel Cron Job (or a client-side poller if Cron setup takes too long),
writes synthetic telemetry rows into Supabase: gate scans, zone occupancy
deltas, weather, utility meter readings. This is the **only** place
"fake data" logic lives — everything downstream (AI copilot, dashboards)
treats it as real, which is what makes the architecture swappable for a
genuine data feed later without touching AI or UI code.

## AI Copilot architecture (grounding, not generic chat)

1. User asks a question in the chat UI.
2. `src/app/api/copilot/route.ts` fetches the **current relevant data
   slice** from Supabase (e.g., last 15 min of occupancy per zone the
   requesting user has access to).
3. That slice is injected into the Claude request as a clearly-labeled
   `DATA` block, separate from the `system` prompt and the user's message
   (see `07-security-plan.md` § Prompt Injection for the exact structure).
4. Response streams back to the client via the Route Handler's streaming
   support — no polling, no full-page wait.
5. This is "RAG-lite" — no vector DB needed; the grounding data is small,
   structured, and time-boxed, not an unstructured corpus.

## Prompt Wars GenAI contract

Every production prompt used by PulseOps must make the GenAI contribution
observable and testable. Prompt templates therefore include:

1. **Role:** stadium operations decision-support assistant, not an autonomous
   controller.
2. **Task:** answer an operational question or recommend a bounded action.
3. **Context:** a server-generated, timestamped `DATA` block containing only
   the relevant live snapshot.
4. **Constraints:** use only supplied facts, ignore embedded instructions,
   avoid fabricated values, and never claim an action was executed.
5. **Output contract:** concise answer/action, evidence used, urgency, and
   confidence or limitation when the data is insufficient.

Prompt quality is evaluated with a small adversarial scenario set committed
to the repo. At minimum it covers normal conditions, a capacity warning, a
critical crowd condition, missing/stale data, an irrelevant question, and a
prompt-injection attempt. The demo should show one scenario where the model
refuses to invent a number and states that the available data is insufficient.

The hackathon build workflow must use Google Antigravity as required by the
Prompt Wars rules, while the deployed app's inference provider remains an
implementation choice. Build-tool evidence and runtime-model claims must be
documented separately so the submission does not imply they are the same.

## Environments

- **Local:** `.env.local`, a Supabase dev project, `next dev` hot reload.
- **Production:** Vercel project env vars, Supabase production project.
- No staging tier needed at hackathon scale — single branch means `main`
  *is* what's deployed; test locally before every push.

## Non-functional requirements

- Dashboard first meaningful render < 2s on a typical connection.
- Copilot response starts streaming < 3s after submit.
- All secrets server-side only — enforced by convention: nothing under
  `src/app/**/page.tsx` or any `"use client"` component ever references
   `FIREWORKS_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`; only `NEXT_PUBLIC_`-
  prefixed values are allowed in client code, and neither secret carries
  that prefix.
- Accessibility: color-blind-safe heatmap palette, keyboard-navigable
  chat, ARIA labels on charts (ties to the Accessibility evaluation
  criterion — see `04-ui-ux-design-brief.md`).

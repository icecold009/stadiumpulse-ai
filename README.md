# PulseOps — StadiumPulse AI

PulseOps is a GenAI command center for FIFA World Cup 2026 stadium operations.
It turns simulated crowd, alert, volunteer, and sustainability signals into
grounded recommendations that remain under human control.

The project targets crowd management, operational intelligence,
sustainability, and real-time decision support for organizers, venue staff,
and volunteers.

## Core decision loop

1. Synthetic telemetry updates stadium occupancy and operational metrics.
2. The protected simulation job detects a warning or critical threshold.
3. GenAI returns a structured recommendation with evidence, urgency,
   confidence, limitations, and snapshot time.
4. Supabase Realtime delivers the alert to the operations dashboard.
5. An authenticated Admin or Operations Manager decides whether to mark it
   handled. The AI never executes the action itself.

## Why the data is simulated

Hackathon teams do not have access to real FIFA 2026 stadium telemetry. This
project uses a synthetic but realistic simulator for gate scans, occupancy,
and utility meters. Simulation is isolated behind the ingestion route, so a
real venue feed could replace it without redesigning the dashboard or GenAI
decision layer. All product telemetry must be presented as simulated.

## Stack

- Next.js 16 App Router and TypeScript
- Supabase Postgres, Auth, RLS, and Realtime
- Tailwind CSS and Recharts
- Anthropic-compatible streaming inference through a server-only API route
- Vercel deployment and authenticated scheduled simulation ticks

## Prerequisites

- Node.js 22 or newer and npm
- A Supabase project with email/password authentication enabled
- An Anthropic-compatible Fireworks AI key
- Vercel only if deploying the hosted cron workflow

## Environment setup

Copy `.env.example` to `.env.local` and set these server/deployment values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only
- `FIREWORKS_API_KEY` — server only; `ANTHROPIC_API_KEY` is accepted as a
  fallback variable name
- `FIREWORKS_RECOMMENDATION_MODEL` — optional structured-output model override;
  defaults to `accounts/fireworks/models/deepseek-v4-pro`
- `CRON_SECRET` — a strong random value shared with Vercel Cron

Never expose the service-role, AI, or cron secret through a `NEXT_PUBLIC_`
variable. Environment values are intentionally absent from this repository.

## Database setup

Install the Supabase CLI, link the intended project, and apply every committed
migration in order:

```powershell
supabase link --project-ref <project-ref>
supabase db push
npm.cmd run seed:demo
npm.cmd run verify:roles
npm.cmd run verify:p0-hosted
```

`seed:demo` upserts deterministic fictional venues, zones, gates, volunteers,
and trusted role rows. It never prints secret values. Migrations under
`supabase/migrations` are the database source of truth; do not reproduce them
with manual dashboard edits.

For the complete hosted check, also set `PULSEOPS_APP_URL` in the invoking
shell (it is not a required deployment variable). `verify:p0-hosted` checks
anonymous denial, cross-role and authorized writes, the durable limiter,
Realtime delivery, an unauthenticated route denial, and a fresh protected tick.

## Demo accounts

Create four Supabase Auth users through a trusted admin workflow, one for each
role: `admin`, `ops_manager`, `sustainability_lead`, and
`volunteer_coordinator`. Store the assignment in `public.user_roles`; runtime
authorization does not trust editable user metadata. Do not commit demo
passwords. Share credentials privately with judges if required.

## Local development and verification

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run eval:prompts
npm.cmd run verify:alert-loop
npm.cmd run build
```

The application runs at `http://localhost:3000`. Local fonts are installed
from npm packages, so production builds do not fetch Google Fonts.
`verify:alert-loop` requires `PULSEOPS_APP_URL` and `CRON_SECRET`; it creates
isolated test telemetry, observes the structured alert over Realtime, and
removes its test rows.

## Deterministic demo scenario

After migrations and environment setup, create a fresh 96%-occupancy critical
scenario with a structured model recommendation:

```powershell
npm.cmd run demo:reset
```

Then:

1. Sign in as Admin or Operations Manager.
2. Open Operations → Alerts.
3. Confirm the recommendation shows its action, urgency, evidence,
   limitations, confidence, and snapshot time.
4. Mark the alert handled.
5. Ask Copilot which zone needs attention and confirm its grounding footer
   cites the current snapshot.

For normal live simulation, authenticated Admin/Ops sessions may call the
manual tick endpoint at a bounded rate. Vercel Cron calls the same route with
`Authorization: Bearer <CRON_SECRET>`. Each successful tick runs alert
detection automatically.

## Failure and recovery

API failures return safe messages without exposing stack traces. Telemetry is
synthetic and regenerable: redeploy from `main`, apply migrations, run
`seed:demo`, and resume the protected simulator. Vercel logs are the current
operational log surface; structured external monitoring is a post-MVP item.

## Submission

The required social deliverable is a LinkedIn post presenting the operational
problem, the simulated-data disclosure, the grounded GenAI decision loop,
responsible-AI safeguards, and the project/demo link. This project does not
claim Google Antigravity usage, a separate narrative submission, or a required
demo video.

## Documentation

The product requirements, architecture, user flows, design system, database,
implementation sequence, security plan, and prioritized backlog are indexed in
[`docs/README.md`](docs/README.md). Coding agents should also read
[`AGENTS.md`](AGENTS.md) before making material changes.

# PulseOps — StadiumPulse AI

PulseOps is a GenAI command center for FIFA World Cup 2026 stadium operations.
It turns live crowd, alert, volunteer, and sustainability signals into concise,
grounded recommendations that a human operator can act on.

The project targets Hack2skill Prompt Wars' **Smart Stadiums & Tournament
Operations** challenge. Its main focus is crowd management, operational
intelligence, sustainability, and real-time decision support for organizers,
venue staff, and volunteers.

## Core demo

1. Synthetic telemetry updates stadium occupancy and operational metrics.
2. Threshold detection creates an alert when a zone becomes unsafe.
3. GenAI drafts a response using the current, timestamped data.
4. The recommendation identifies the evidence it used.
5. A human operator remains responsible for marking the incident handled.

## Why the data is simulated

Hackathon teams do not have access to real FIFA 2026 stadium telemetry. This
project uses a synthetic but realistic simulator for gate scans, occupancy,
and utility meters. Simulation is isolated behind the ingestion route, so a
real venue feed could replace it without redesigning the dashboard or GenAI
decision layer.

## Stack

- Next.js App Router and TypeScript
- Supabase Postgres, Auth, RLS, and Realtime
- Tailwind CSS and Recharts
- Anthropic-compatible streaming inference through a server-only API route
- Vercel deployment and scheduled simulation ticks

## Documentation

The product requirements, architecture, user flows, design system, database,
implementation sequence, security plan, and prioritized backlog are indexed in
[`docs/README.md`](docs/README.md). Coding agents should also read
[`AGENTS.md`](AGENTS.md) before making material changes.

## Hackathon disclosure

Prompt Wars requires Google Antigravity usage and a dual submission consisting
of working code plus a narrative. Build-process evidence should be supplied
with the submission; this repository does not claim that evidence merely from
the runtime implementation.

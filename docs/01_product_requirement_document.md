# 01 · Product Requirement Document (PRD)

## Product name
**PulseOps** — an AI Command Center for Tournament Organizers

## Hack2skill Prompt Wars challenge alignment

**Challenge:** Smart Stadiums & Tournament Operations

> Build a GenAI-enabled solution that enhances stadium operations and the
> overall tournament experience for fans, organizers, volunteers, or venue
> staff. The solution must leverage Generative AI to improve navigation,
> crowd management, accessibility, transportation, sustainability,
> multilingual assistance, operational intelligence, or real-time decision
> support during the FIFA World Cup 2026.

PulseOps answers this prompt through the **organizer, venue-staff, and
volunteer** user groups. Its primary challenge tracks are **crowd
management**, **sustainability**, **operational intelligence**, and
**real-time decision support**. It deliberately does not attempt to cover
every track. The strongest hackathon submission is one coherent operational
workflow with visible GenAI value, not a collection of unrelated features.

The core proof is a closed decision loop:

`simulated live signal → detected risk → grounded GenAI recommendation → human action → updated operational state`

The dashboard alone is not the innovation. GenAI must interpret the current
multi-source context, explain the evidence it used, recommend a concrete
action, and keep a human operator in control.

## Problem
During a mega-event like the FIFA World Cup 2026, organizers juggle live
signals from dozens of sources — gate throughput, zone occupancy, weather,
transport load, concessions, medical incidents, waste/energy metrics — and
have to make fast calls on staffing, crowd flow, and sustainability targets.
Today this is dashboards + spreadsheets + radio calls. There's no single
place that turns raw signals into a plain-language recommendation an
operations manager can act on in seconds.

## Solution, in one line
A live ops dashboard where organizers see crowd/resource/sustainability data
as visuals, **and** can ask a GenAI copilot plain-language questions ("Which
gate needs more staff in the next 30 minutes?") and get answers grounded in
the real-time data — not a generic chatbot guessing.

## Target users (personas)

| Persona | Need |
|---|---|
| **Operations Manager** | Real-time crowd density per zone, staff reallocation suggestions |
| **Sustainability Lead** | Waste/energy/water tracking against tournament targets, AI-suggested interventions |
| **Volunteer Coordinator** | Where volunteers are thin, where to redeploy |
| **Admin / Tournament Director** | Cross-venue summary, anomaly/incident alerts |

Since this is a hackathon build, we simulate stadium telemetry with a
realistic synthetic data generator (clearly labeled as simulated) rather than
requiring live FIFA integrations that don't exist for us to connect to.

## Core features (must-have, in priority order)

1. **Live Ops Dashboard** — zone-by-zone occupancy heatmap, gate throughput,
   incident feed, refreshed on an interval.
2. **AI Copilot Chat** — natural-language Q&A over the current data
   snapshot. Every answer must cite the underlying numbers it used (no
   hallucinated stats).
3. **Resource Allocation Advisor** — given current + predicted density, the
   AI proposes staff/security/medical redeployment, with a one-line
   rationale per suggestion.
4. **Sustainability Tracker** — energy, water, waste-diversion metrics per
   venue vs. target, with AI-generated "here's what would move the needle"
   suggestions.
5. **Anomaly Alerts** — threshold breaches (e.g., zone occupancy > 90%)
   surfaced automatically, AI drafts a short recommended action for each.
6. **Role-based views** — each persona sees a dashboard tuned to their job;
   Admin sees everything.

## Nice-to-have (only if time remains)

- Multi-venue comparison view.
- Historical trend charts (day-over-day).
- Exportable end-of-match ops summary (AI-generated).

## Explicitly out of scope

- Real integrations with actual stadium IoT/ticketing systems.
- Native mobile app (responsive web is enough).
- Public fan-facing features (this vertical is organizer-only).

## Success criteria for the submission

- A judge can log in as each of the four roles and see a coherent,
  role-appropriate experience within 2 minutes.
- The AI copilot gives an answer grounded in visible dashboard numbers at
  least 3 times during a demo walkthrough, with no fabricated figures.
- Repo is public, single branch, under 10MB, README explains the assumption
  that data is simulated and why.
- A judge can trigger or observe at least one complete decision loop: a zone
  approaches capacity, an alert appears, GenAI recommends a response using
  cited live values, and an operator marks the response handled.
- The demo and narrative explicitly map each showcased screen to one of the
  selected challenge tracks; features outside those tracks are not presented
  as core scope.
- The submission includes evidence of the required Prompt Wars build process
  and a short narrative explaining the prompt strategy, iterations, grounding
  approach, and responsible-AI safeguards.

## Key assumption to state explicitly in the README

There is no way for a hackathon team to access real FIFA 2026 stadium
telemetry. The app is built against a **synthetic but realistic data
simulator** that mimics gate scans, zone sensors, weather feeds, and
utility meters. The architecture is designed so a real data feed could be
swapped in without changing the AI or UI layers — this should be called out
as a deliberate design decision, not a shortcut.

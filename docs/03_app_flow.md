# 03 · App Flow

## High-level navigation map

```
Login (Supabase Auth)
  │
  ▼
Role resolved from trusted `user_roles` row
  │
  ├── Admin ─────────────► Global Overview
  ├── Operations Manager ─► Ops Dashboard (default view)
  ├── Sustainability Lead ► Sustainability Dashboard
  └── Volunteer Coordinator ► Volunteer Deployment View

All roles ─────────────► AI Copilot Chat (persistent side panel, always available)
```

## Screen-by-screen flow

### 1. Login
- Email + password via Supabase Auth.
- On success, role (`admin | ops_manager | sustainability_lead |
  volunteer_coordinator`) read from the authenticated user's protected
  `user_roles` row, routes to the right
  default screen.
- Failed auth: clear inline error, no stack traces exposed (security tie-in).

### 2. Global Overview (Admin only)
- Card grid: one card per venue, showing occupancy %, active alerts count,
  sustainability score.
- Click a venue card → drills into `/ops?venueId=<uuid>` while preserving the
  trusted Admin venue scope.
- Download an Admin-only measured-versus-analysis match summary as JSON or CSV.
- Top-level incident feed across all venues.

### 3. Ops Dashboard (Operations Manager)
- Venue-scoped situation room with freshness-aware occupancy risk and gate flow.
- Highest-risk zone cards show trend, capacity, open alerts, and contextual
  Copilot entry points.
- Gate throughput cards show the latest reading and direction.
- Live incident/alert list, each with an AI-suggested action and a
  human-controlled Accept, Reject, and Mark handled actions. Accept/reject
  records feedback on the recommendation without claiming the incident was
  resolved; Mark handled closes the incident separately.
- "Resource Allocation Advisor" panel: AI-generated staffing suggestions,
  refreshed every simulated tick.

### 4. Sustainability Dashboard (Sustainability Lead)
- Energy / water / waste-diversion gauges vs. target.
- Trend line over the simulated match-day timeline.
- AI-generated "recommended interventions" list (e.g., "Zone C waste bins
  trending toward overflow — recommend early collection run").

### 5. Volunteer Deployment View (Volunteer Coordinator)
- Map/grid of zones with current volunteer count vs. AI-recommended count
  based on occupancy.
- Drag-style or button-based "reassign" action (writes back to Supabase).

### 6. AI Copilot Chat (all roles, persistent)
- Text input + streamed response.
- Each response shows a small "grounded in: [data used]" footer so users
  can see it isn't freeform.
- Optional zone and venue context can be supplied by a dashboard action; the
  server validates both IDs against the trusted venue scope.
- Exchanges are persisted in `copilot_queries` for auditability and purged by
  the protected 24-hour retention job.

### 7. Alerts / Anomaly flow (cross-cutting)
- Backend tick detects threshold breach → writes alert row → Supabase
  Realtime pushes it to any subscribed dashboard → toast notification +
  entry in incident feed, with AI-drafted one-line recommended action
  attached at creation time (pre-generated, not on-demand, to keep alerts
  instant).

## State ownership

- **Server-authoritative:** all telemetry, alerts, sustainability metrics —
  single source of truth in Supabase, never faked client-side.
- **Client-local:** chat draft text, UI filters/toggles, selected venue.

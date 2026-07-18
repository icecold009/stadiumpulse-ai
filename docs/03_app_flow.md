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
- Click a venue card → drills into that venue's Ops Dashboard.
- Top-level incident feed across all venues.

### 3. Ops Dashboard (Operations Manager)
- Zone occupancy heatmap (SVG grid, color-coded).
- Gate throughput line chart (last 60 min).
- Live incident/alert list, each with an AI-suggested action and a
  "Mark handled" button.
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
- Chat history scoped to the session, not persisted long-term (keeps DB
  small and side-steps storing potentially sensitive query logs long-term).

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

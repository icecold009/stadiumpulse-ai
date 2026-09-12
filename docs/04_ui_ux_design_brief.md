# 04 · UI/UX Design Brief

## Design principles
1. **Operator tool, not a marketing site.** Dense, scannable, low
   ornamentation. Every pixel should help someone make a decision faster.
2. **Status must be legible at a glance.** Color is paired with labels and
   icons for normal/warning/critical states; no decision depends on color
   alone.
3. **AI output looks distinct from raw data**, so users always know what's
   measured vs. what's generated — this builds trust and satisfies the
   "responsible GenAI use" spirit of the challenge.

## Color system

The console uses a refined dark theme by default and an explicit light theme
for bright operating environments. Theme state is applied to `<html>` with
`data-theme`, persisted under `pulseops-theme`, and initialized dark during
server rendering to avoid a light-mode flash. Theme controls are available on
the login surface and in the authenticated shell.

| Token | Dark | Light | Use |
|---|---|---|
| `--canvas` | `#111513` | `#F1EFE8` | App canvas |
| `--surface` | `#181D19` | `#FBFAF6` | Panels and primary sections |
| `--surface-raised` | `#202720` | `#FFFFFF` | Drawers, focused surfaces |
| `--foreground` | `#F2F0E8` | `#1C2420` | Primary ink |
| `--accent` | `#B8D7BD` | `#2F6B4D` | Brand and confirmed/active affordances |
| `--status-warn` | `#E0AA59` | `#9A5B12` | Watch state and review-needed state |
| `--status-critical` | `#E17A72` | `#A33E37` | Breach and active incident |
| `--ai-highlight` | `#B7A1D6` | `#72509B` | AI-generated content and evidence treatment |
| `--border` | `#2C362E` | `#D7DED6` | Quiet structure and control boundaries |

The palette avoids decorative gradients. Status surfaces use restrained tint,
border, icon, and text combinations, with an accessible label alongside each
state.

## Typography

- **UI font:** DM Sans, bundled locally with a system sans fallback.
- **Telemetry font:** IBM Plex Mono, used for measured values, counts,
  percentages, timestamps, and compact operational identifiers.
- Scale: 11/13/15/18/24/36px, with deliberate weight contrast for page titles,
  labels, and measured values.

## Layout

- Full-width canvas with a compact 248px desktop rail and a single-column
  mobile flow. Panels use quiet borders, 14–18px radii, and restrained
  elevation instead of nested rounded containers.
- Persistent role-appropriate navigation on desktop; a sticky two-row mobile
  header keeps scope, theme, navigation, and emergency alert access visible.
- AI Copilot as a right-side slide-over panel, never a full-page takeover —
  keeps dashboard data visible while chatting.
- Every AI-generated card/suggestion carries muted lilac borders and an
  explicit "AI suggestion" or "Grounded in" treatment — never presented
  identically to raw sensor data.

## Component standards

- `Panel`, `PageHeader`, and `SectionHeader` establish the shared hierarchy.
- Buttons use `Primary`, `Secondary`, `Quiet`, `AI`, and `Danger` semantics.
  Transitions name only the properties that change, and press feedback is
  subtle.
- `StatusBadge` and `DataFreshnessBadge` always include text and an icon.
- Loading, empty, stale, unavailable, and error states explain what is known,
  what is missing, and the next safe action. No fabricated metrics or advice.
- The operator context strip exposes the trust chain:
  `Simulated live → Signal → Risk → AI guidance → Human decision`.

## Accessibility requirements (non-negotiable, tied to evaluation)

- WCAG AA contrast minimum everywhere.
- All charts have a text-equivalent summary (for screen readers).
- Full keyboard navigation; visible focus states using `--accent`.
- No information conveyed by color alone — icons/labels accompany every
  status color.
- Respect `prefers-reduced-motion` for all transitions; transform-based motion
  is removed. Hover-only motion is restricted to pointer-capable devices and
  keyboard actions do not trigger decorative motion.

## Operator console interaction contract

The post-hackathon console keeps the decision loop visible at the point of
action:

- Priority alerts, current venue scope, and data freshness appear before
  secondary metrics. An incident-focus mode collapses gate flow and decision
  history while an alert is active; the mobile emergency view exposes only
  scope context, the critical recommendation, and human actions.
- Measured values use the neutral/teal data language. AI suggestions keep the
  purple treatment and must show evidence, confidence, limitations, source,
  snapshot time, freshness, and an explicit human-review state.
- Accept and reject are recommendation feedback. Mark handled is the separate
  incident outcome. If an operator decision is recorded, the UI says so
  without exposing the operator's private identifier.
- A, R, C, and M focus alerts, refresh the current view, open Copilot, and
  return focus to main content. Focus rings remain visible for every action.
- Copilot is a right-origin slide-over with a short drawer transition. It
  returns focus to the originating control and distinguishes loading, failed,
  stale, missing-data, and grounded response states.
- Numeric values do not animate on every telemetry tick. Realtime changes use
  restrained color/opacity feedback, and reduced-motion users receive no
  transform-based motion.

## Component inventory (build once, reuse everywhere)

`Panel`, `PageHeader`, `SectionHeader`, `StatusBadge`, `DataFreshnessBadge`,
`MetricGauge`, `ZoneHeatmapCell`, `AlertCard`, `AISuggestionCard`, `ChatBubble`
(user vs. AI variants), `RoleNav`, `ThemeToggle`, and `TrendLine`.

## Tone of voice for AI-generated text

Short, declarative, operational. "Zone C nearing capacity — redirect
inflow to Gate 4." Not conversational filler. This is a control room, not a
chatbot for chatting's sake.

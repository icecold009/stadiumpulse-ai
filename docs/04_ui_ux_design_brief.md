# 04 · UI/UX Design Brief

## Design principles
1. **Operator tool, not a marketing site.** Dense, scannable, low
   ornamentation. Every pixel should help someone make a decision faster.
2. **Status must be legible at a glance.** Color coding for
   normal/warning/critical is the primary visual language.
3. **AI output looks distinct from raw data**, so users always know what's
   measured vs. what's generated — this builds trust and satisfies the
   "responsible GenAI use" spirit of the challenge.

## Color system

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0B0F14` | App background (dark mode default — control-room feel) |
| `--surface` | `#141A21` | Cards, panels |
| `--surface-raised` | `#1C242D` | Modals, chat panel |
| `--text-primary` | `#EDEFF2` | Primary text |
| `--text-muted` | `#8B96A3` | Secondary text |
| `--accent` | `#3DD6C4` | Primary accent (teal — FIFA-adjacent but not infringing on brand colors) |
| `--status-ok` | `#2FBF71` | Normal occupancy / on-target sustainability |
| `--status-warn` | `#F5A524` | Approaching threshold |
| `--status-critical` | `#E5484D` | Breach / active incident |
| `--ai-highlight` | `#8B5CF6` | Any AI-generated content border/badge (distinct from data color language) |

Heatmap gradient uses a **color-blind-safe** scale (blue → yellow → red,
not red/green) — direct tie to the Accessibility evaluation criterion.

## Typography

- **UI font:** Inter (system-ui fallback) — excellent legibility at small
  sizes for dense dashboards.
- **Monospace (for data/numbers):** JetBrains Mono — used for all live
  metrics so numbers align in tables/lists.
- Scale: 12/14/16/20/28px, minimal weight variation (400/500/600 only) to
  keep density calm rather than shouty.

## Layout

- 12-column responsive grid, collapsing to a single column under 768px.
- Persistent left nav (role-appropriate items only).
- AI Copilot as a right-side slide-over panel, never a full-page takeover —
  keeps dashboard data visible while chatting.
- Every AI-generated card/suggestion carries a small purple-bordered badge
  labeled "AI suggestion" — never presented identically to raw sensor data.

## Accessibility requirements (non-negotiable, tied to evaluation)

- WCAG AA contrast minimum everywhere.
- All charts have a text-equivalent summary (for screen readers).
- Full keyboard navigation; visible focus states using `--accent`.
- No information conveyed by color alone — icons/labels accompany every
  status color.
- Respect `prefers-reduced-motion` for chart transitions.

## Component inventory (build once, reuse everywhere)

`StatusBadge`, `MetricGauge`, `ZoneHeatmapCell`, `AlertCard`,
`AISuggestionCard`, `ChatBubble` (user vs. AI variants), `RoleNav`,
`TrendLine`.

## Tone of voice for AI-generated text

Short, declarative, operational. "Zone C nearing capacity — redirect
inflow to Gate 4." Not conversational filler. This is a control room, not a
chatbot for chatting's sake.
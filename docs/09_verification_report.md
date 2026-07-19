# PulseOps verification report

**Date:** 2026-07-19

**Target:** `https://stadiumpulse-ai-nine.vercel.app`

**Verified revision:** `c7ebfa2` (`main`, synchronized with `origin/main`)

## Quality and CI-equivalent gates

| Gate | Result |
|---|---|
| ESLint / TypeScript | Pass / pass |
| Node contract tests | 13 passed, 0 failed (auth matrix, API inputs, Copilot context, advisor) |
| Static prompt contracts | Pass: five data states plus injection separation |
| Production build | Pass |
| Production dependency audit | 0 known vulnerabilities |
| Pushed GitHub Actions | Pass on current revision `c7ebfa2` (run `29675185549`) |

## Live authorization and security

| Role | Allowed pages | Forbidden-page behavior | Alerts API |
|---|---|---|---:|
| Admin | Overview, Ops, Alerts, Sustainability, Volunteers | N/A | 200 |
| Operations Manager | Ops, Alerts | 307 to `/ops` | 200 |
| Sustainability Lead | Sustainability | 307 to `/sustainability` | 403 |
| Volunteer Coordinator | Volunteers | 307 to `/volunteers` | 403 |

Unauthenticated Copilot, simulation, and alert-check requests returned 401. Deployed headers include HSTS, `nosniff`, `DENY`, strict-origin referrer policy, and a restrictive CSP. Hosted passwordless login established normal sessions for all four roles, and the complete documented page/API authorization matrix passed. Live-model checks blocked prompt extraction and handled missing/stale data without inventing a current numeric recommendation.

The deployed Copilot returned non-empty grounded answers for all four roles on
2026-07-19. Metadata confirmed the intended role-specific data slices: crowd
and alerts for Operations Manager, sustainability metrics for Sustainability
Lead, volunteer assignments for Volunteer Coordinator, and the combined slice
for Admin. Total streamed response times ranged from 5.6 s to 13.5 s.

## Accessibility and performance

| Audit | Result |
|---|---|
| Lighthouse login | Performance 77, Accessibility 100, Best Practices 96, SEO 82 |
| Web vitals (lab) | FCP 1.1 s, LCP 2.6 s, TBT 800 ms, CLS 0 |
| axe-core WCAG A/AA login | 0 violations, 21 passed rules |
| Source inspection checklist | Skip link, visible focus, focus trap/Escape restore, live regions, chart text equivalents, non-color labels, and reduced motion present |

Automated results cover the deployed login surface. The interactive browser was unavailable, so a true manual audit was not run. Keyboard-only traversal, screen-reader output, contrast sampling, and 200% zoom on authenticated dashboards remain unclaimed.

## Resolved finding

The earlier deployment returned `meta` and `done` events without text. The published fix disables model reasoning for this short operational response, raises the answer budget to 768 tokens, and converts empty output into an explicit safe error. The deployed four-role Copilot and Admin prompt-injection probe passed on 2026-07-19.

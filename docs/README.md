# PulseOps documentation index

Use this page to find the minimum context needed for a task.

| Document | Purpose | Read when |
|---|---|---|
| `01_product_requirement_document.md` | Product problem, users, scope, challenge alignment, and success criteria | Scoping features or judging product fit |
| `02_technical_requirement_document.md` | Architecture, stack, AI grounding, prompt contract, and non-functional requirements | Changing architecture, APIs, AI, or infrastructure |
| `03_app_flow.md` | Navigation, role flows, screens, alerts, and state ownership | Changing routes, roles, or user journeys |
| `04_ui_ux_design_brief.md` | Visual system, accessibility, component inventory, and AI presentation | Building or reviewing UI |
| `05_backend_schema.md` | Tables, roles, indexes, retention, and migration guidance | Changing data access or schema |
| `06_implementation_plan.md` | Build order, critical demo path, and Prompt Wars submission package | Planning implementation or demo work |
| `07_security_plan.md` | RLS, secrets, authorization, prompt injection, rate limits, logging, and recovery | Changing any API, auth, AI, or database behavior |
| `08_project_backlog.md` | Prioritized, status-tracked future work | Starting or completing any planned task |

## Recommended reading paths

- **Small UI change:** 04, then the relevant part of 03.
- **API or database change:** 02, 05, 07, then 08.
- **AI or prompt change:** 01, 02, 07, then 08.
- **New feature or scope decision:** 01, 03, 06, then 08.
- **Hackathon submission work:** 01, 06, 07, then the submission section of 08.

`AGENTS.md` at the repository root contains the coding-agent rules and
verification expectations that apply across the project.

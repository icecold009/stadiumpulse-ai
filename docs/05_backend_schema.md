# 05 · Backend Schema

Database: Supabase Postgres. All tables live in the `public` schema unless
noted. Every table has RLS enabled (see 07 · Security Plan for policies) —
schema and security are designed together, not bolted on after.

## Core tables

### `venues`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| name | text | |
| city | text | |
| capacity | int | |
| created_at | timestamptz | default now() |

### `zones`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| venue_id | uuid, fk → venues.id | |
| label | text | e.g. "Zone C — East Concourse" |
| capacity | int | |

### `zone_telemetry` (append-only, simulated sensor feed)
| Column | Type | Notes |
|---|---|---|
| id | bigint, pk, identity | |
| zone_id | uuid, fk → zones.id | |
| occupancy | int | |
| recorded_at | timestamptz | default now(), indexed |

### `gates`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| venue_id | uuid, fk → venues.id | |
| label | text | |

### `gate_scans` (append-only)
| Column | Type | Notes |
|---|---|---|
| id | bigint, pk, identity | |
| gate_id | uuid, fk → gates.id | |
| scan_count | int | scans in the last interval, not cumulative |
| recorded_at | timestamptz | indexed |

### `sustainability_metrics` (append-only)
| Column | Type | Notes |
|---|---|---|
| id | bigint, pk, identity | |
| venue_id | uuid, fk → venues.id | |
| metric_type | text | `energy_kwh` \| `water_l` \| `waste_diverted_pct` |
| value | numeric | |
| target | numeric | |
| recorded_at | timestamptz | indexed |

### `alerts`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| venue_id | uuid, fk → venues.id | |
| zone_id | uuid, fk → zones.id, nullable | |
| severity | text | `warn` \| `critical` |
| message | text | human-readable description |
| ai_recommendation | text | validated AI-drafted action, generated once at alert creation |
| ai_urgency | text | `monitor` \| `prompt` \| `immediate` |
| ai_evidence | text | snapshot facts used by the recommendation |
| ai_limitations | text | missing context and bounded uncertainty |
| ai_confidence | text | `low` \| `medium` \| `high` |
| recommendation_source | text | `ai` \| `fallback`; prevents fallback text being mislabeled as AI |
| snapshot_at | timestamptz | source telemetry time used for the recommendation |
| operator_decision | text, nullable | `accepted` \| `rejected`; human response to the recommendation |
| decision_by | uuid, nullable | authenticated operator who accepted/rejected |
| decision_at | timestamptz, nullable | recommendation feedback time |
| status | text | `open` \| `handled` |
| created_at | timestamptz | |
| handled_by | uuid, fk → auth.users.id, nullable | |
| handled_at | timestamptz, nullable | |

### `volunteers`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| venue_id | uuid, fk → venues.id | |
| zone_id | uuid, fk → zones.id, nullable | current assignment |
| name | text | |
| status | text | `assigned` \| `available` |

### `copilot_queries` (short-lived, session-scoped log)
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid, fk → auth.users.id | |
| question | text | |
| grounded_data_summary | text | what data was injected, for auditability |
| answer | text | |
| created_at | timestamptz | |

> **Retention note:** `copilot_queries` is purged on a schedule (e.g.
> nightly job deletes rows older than 24h) — this keeps the DB small and
> limits how long user-submitted text is retained, relevant to both the
> repo-size constraint's spirit and general data-minimization practice.

### `user_roles` (trusted authorization source)
| Column | Type | Notes |
|---|---|---|
| user_id | uuid, pk, fk → auth.users.id | one role per account |
| role | text | `admin` \| `ops_manager` \| `sustainability_lead` \| `volunteer_coordinator` |

Authenticated users may select only their own row. Browser clients cannot
insert, update, or delete roles. Demo roles are provisioned through a trusted
admin/service-role workflow; authorization code and RLS policies read this
table rather than editable user metadata.

### `rate_limits` (server-only abuse control)
| Column | Type | Notes |
|---|---|---|
| subject | text, pk part | authenticated user id or trusted `cron` subject |
| action | text, pk part | bounded route/work category |
| window_start | timestamptz, pk part | fixed request window |
| request_count | int | atomically incremented by `consume_rate_limit` |

RLS is enabled with no browser policies. Only the service role can execute the
atomic limiter function; routes consume a limit after authentication and
before privileged database writes or model calls.

## User roles

```json
{ "role": "admin" | "ops_manager" | "sustainability_lead" | "volunteer_coordinator" }
```

The migration to `user_roles` backfills valid roles from existing demo account
metadata once. Afterward, the table is authoritative and roles are
admin-provisioned; changing user metadata does not change authorization. There
is no public self-signup because this is an internal organizer tool.

## Indexing notes

- All `recorded_at` / `created_at` columns on append-only tables are
  indexed — dashboards always query "last N minutes," so this keeps reads
  fast without needing a time-series DB.
- Consider a nightly job to roll up `zone_telemetry` older than 24h into
  hourly aggregates and drop raw rows, if the simulator runs for an
  extended demo period — keeps storage flat.

## Migrations

Kept as numbered SQL files in `/supabase/migrations/`, applied via the
Supabase CLI (`supabase db push`). Never hand-edit schema directly in the
dashboard for anything you want reproducible — migrations are the source
of truth and get committed to git (they're small text files, no bloat risk).

- `0001_init.sql`: core tables, indexes, and initial RLS policies.
- `0002_seed.sql`: deterministic synthetic venues, zones, and gates.
- `0003_user_roles_and_realtime.sql`: trusted roles, role-based update
  policies, grants, and Realtime publication membership.
- `0004_seed_volunteers.sql`: deterministic fictional volunteer assignments.
- `0005_fix_sustainability_read_policy.sql`: restores authenticated
  sustainability reads after detecting live-environment policy drift.
- `0006_p0_security_and_auditability.sql`: adds typed alert recommendation
  evidence fields and durable server-only rate limiting.
- `0007_ensure_realtime_publication.sql`: idempotently reconciles the hosted
  Realtime publication after migration-history drift was discovered.
- `0008_operator_recommendation_feedback.sql`: records explicit human
  acceptance/rejection separately from incident handling.

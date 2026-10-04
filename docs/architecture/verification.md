# Documentation verification

Snapshot: `f935f1f487d93a56e40314a31c50d8b88a36accb`. Run `node docs/architecture/verify.mjs --self-test`. This validates inventory equality, graph endpoints, source targets, embedded diagrams and source-map ranges, with ten intended negative cases. These checks do not prove semantic exhaustiveness, provider, deployment or physical-device success.

AI supplies advice; authenticated humans accept, reject or handle alerts. Telemetry is synthetic. Jev occupancy-shadow files from the older local snapshot are absent from this hosted source and are not drawn. Server-only secrets, RLS, role/venue authorization and provider availability are boundaries, not new hosted verification.

## Source keys

- [S1](../../src/components/dashboard/ops-command-center.tsx)
- [S2](../../src/lib/auth/venue-scope.ts)
- [S3](../../src/app/api/simulate-tick/route.ts)
- [S4](../../src/lib/alerts/check-alerts.ts)
- [S5](../../src/lib/ai/alert-recommendation.ts)
- [S6](../../src/lib/ai/client.ts)
- [S7](../../src/lib/ops/load-snapshot.ts)
- [S8](../../src/components/dashboard-poller.tsx)
- [S9](../../src/app/api/volunteers/[id]/reassign/route.ts)
- [S10](../../src/app/api/maintenance/telemetry-rollup/route.ts)
- [S11](../../src/lib/supabase/server.ts)
- [S12](../../package.json)

Ranges reference complete representative modules for each subsystem dependency, not line-specific proof of every internal operation. Large module context is independently inspected using focused entry-point/dependency searches; a source map is not a full code audit.

| Arrow | Source ranges | Evidence |
|---|---|---|
| O AUTH --> UI | S2:1-89, S1:1-259 | Current pinned source; no prior typed judgment transferred |
| O UI --> SNAP | S1:1-259, S7:1-93 | Current pinned source; no prior typed judgment transferred |
| O SNAP --> AUTH | S7:1-93, S2:1-89 | Current pinned source; no prior typed judgment transferred |
| O SNAP --> DB | S7:1-93, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| O SIM --> DB | S3:1-220, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| O SIM --> ALERT | S3:1-220, S4:1-143 | Current pinned source; no prior typed judgment transferred |
| O ALERT --> ADVICE | S4:1-143, S5:1-135 | Current pinned source; no prior typed judgment transferred |
| O ALERT --> DB | S4:1-143, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| O ADVICE .-> AI | S5:1-135, S6:1-25 | Current pinned source; no prior typed judgment transferred |
| O AI .-> ADVICE | S6:1-25, S5:1-135 | Current pinned source; no prior typed judgment transferred |
| O DB --> LIVE | S11:1-31, S8:1-10 | Current pinned source; no prior typed judgment transferred |
| O LIVE --> UI | S8:1-10, S1:1-259 | Current pinned source; no prior typed judgment transferred |
| O UI --> ALERT | S1:1-259, S4:1-143 | Current pinned source; no prior typed judgment transferred |
| O UI --> OPS | S1:1-259, S9:1-88 | Current pinned source; no prior typed judgment transferred |
| O OPS --> DB | S9:1-88, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| O MAINT --> DB | S10:1-61, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| O SUPPORT .-> UI | S12:1-55, S1:1-259 | Current pinned source; no prior typed judgment transferred |
| D AUTH --> UI | S2:1-89, S1:1-259 | Current pinned source; no prior typed judgment transferred |
| D UI --> SNAP | S1:1-259, S7:1-93 | Current pinned source; no prior typed judgment transferred |
| D SNAP --> AUTH | S7:1-93, S2:1-89 | Current pinned source; no prior typed judgment transferred |
| D SNAP --> DB | S7:1-93, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| D SIM --> DB | S3:1-220, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| D SIM --> ALERT | S3:1-220, S4:1-143 | Current pinned source; no prior typed judgment transferred |
| D ALERT --> ADVICE | S4:1-143, S5:1-135 | Current pinned source; no prior typed judgment transferred |
| D ALERT --> DB | S4:1-143, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| D ADVICE .-> AI | S5:1-135, S6:1-25 | Current pinned source; no prior typed judgment transferred |
| D AI .-> ADVICE | S6:1-25, S5:1-135 | Current pinned source; no prior typed judgment transferred |
| D DB --> LIVE | S11:1-31, S8:1-10 | Current pinned source; no prior typed judgment transferred |
| D LIVE --> UI | S8:1-10, S1:1-259 | Current pinned source; no prior typed judgment transferred |
| D UI --> ALERT | S1:1-259, S4:1-143 | Current pinned source; no prior typed judgment transferred |
| D UI --> OPS | S1:1-259, S9:1-88 | Current pinned source; no prior typed judgment transferred |
| D OPS --> DB | S9:1-88, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| D MAINT --> DB | S10:1-61, S11:1-31 | Current pinned source; no prior typed judgment transferred |
| D SUPPORT .-> UI | S12:1-55, S1:1-259 | Current pinned source; no prior typed judgment transferred |

Jev review receipts and actual gates are disclosed in publication.md; no model approval or production evidence is inferred.

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveVenueScope } from "@/lib/auth/venue-scope";
import { buildOpsSnapshot } from "@/lib/ops/snapshot";
import type { OpsSnapshot } from "@/lib/ops/types";

export type LoadOpsSnapshotResult =
    | { ok: true; snapshot: OpsSnapshot }
    | { ok: false; status: 400 | 401 | 403 | 500; error: string };

export async function loadOpsSnapshot(
    requestedVenueId?: string | null,
    windowMinutes = 60
): Promise<LoadOpsSnapshotResult> {
    const scopeResult = await resolveVenueScope(requestedVenueId);
    if (!scopeResult.ok) return scopeResult;

    const scope = scopeResult.scope;
    const supabase = await createSupabaseServerClient();
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const [zonesResult, gatesResult, alertsResult] = await Promise.all([
        supabase
            .from("zones")
            .select("id, venue_id, label, capacity")
            .in("venue_id", scope.queryVenueIds),
        supabase
            .from("gates")
            .select("id, venue_id, label")
            .in("venue_id", scope.queryVenueIds),
        supabase
            .from("alerts")
            .select("id, venue_id, zone_id, severity, message, ai_recommendation, ai_urgency, ai_evidence, ai_limitations, ai_confidence, recommendation_source, snapshot_at, operator_decision, decision_at, status, created_at")
            .in("venue_id", scope.queryVenueIds)
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(100),
    ]);

    if (zonesResult.error || gatesResult.error || alertsResult.error) {
        console.error("[ops-snapshot] reference query failed", {
            message: zonesResult.error?.message ?? gatesResult.error?.message ?? alertsResult.error?.message,
        });
        return { ok: false, status: 500, error: "Could not load operations snapshot." };
    }

    const zones = zonesResult.data ?? [];
    const gates = gatesResult.data ?? [];
    const zoneIds = zones.map((zone) => zone.id);
    const gateIds = gates.map((gate) => gate.id);

    const [telemetryResult, scansResult] = await Promise.all([
        zoneIds.length > 0
            ? supabase
                .from("zone_telemetry")
                .select("zone_id, occupancy, recorded_at")
                .in("zone_id", zoneIds)
                .gte("recorded_at", windowStart)
                .order("recorded_at", { ascending: false })
                .limit(1000)
            : Promise.resolve({ data: [], error: null }),
        gateIds.length > 0
            ? supabase
                .from("gate_scans")
                .select("gate_id, scan_count, recorded_at")
                .in("gate_id", gateIds)
                .gte("recorded_at", windowStart)
                .order("recorded_at", { ascending: false })
                .limit(1000)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (telemetryResult.error || scansResult.error) {
        console.error("[ops-snapshot] telemetry query failed", {
            message: telemetryResult.error?.message ?? scansResult.error?.message,
        });
        return { ok: false, status: 500, error: "Could not load operations telemetry." };
    }

    return {
        ok: true,
        snapshot: buildOpsSnapshot({
            zones,
            telemetry: telemetryResult.data ?? [],
            gates,
            gateScans: scansResult.data ?? [],
            alerts: alertsResult.data ?? [],
            selectedVenueId: scope.selectedVenueId,
        }),
    };
}

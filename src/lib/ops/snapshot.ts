import type { Database } from "@/types/database";
import type {
    AlertSummary,
    DataFreshness,
    DecisionEvent,
    GateMetric,
    OpsSnapshot,
    TrendDirection,
    ZoneRisk,
    ZoneRiskStatus,
} from "@/lib/ops/types";

function classifyFreshness(observedAt: string | null | undefined, now: number): DataFreshness {
    if (!observedAt) return { state: "missing", observedAt: null, ageSeconds: null };
    const timestamp = Date.parse(observedAt);
    if (!Number.isFinite(timestamp)) return { state: "missing", observedAt: null, ageSeconds: null };
    const ageSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    const state = ageSeconds <= 5 * 60 ? "fresh" : ageSeconds <= 15 * 60 ? "stale" : "missing";
    return { state, observedAt, ageSeconds };
}

function newestTimestamp(values: Array<string | null | undefined>): string | null {
    return values
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

type ZoneRow = Pick<Database["public"]["Tables"]["zones"]["Row"], "id" | "venue_id" | "label" | "capacity">;
type ZoneTelemetryRow = Pick<Database["public"]["Tables"]["zone_telemetry"]["Row"], "zone_id" | "occupancy" | "recorded_at">;
type GateRow = Pick<Database["public"]["Tables"]["gates"]["Row"], "id" | "venue_id" | "label">;
type GateScanRow = Pick<Database["public"]["Tables"]["gate_scans"]["Row"], "gate_id" | "scan_count" | "recorded_at">;
type AlertRow = Pick<
    Database["public"]["Tables"]["alerts"]["Row"],
    | "id"
    | "venue_id"
    | "zone_id"
    | "severity"
    | "message"
    | "ai_recommendation"
    | "ai_urgency"
    | "ai_evidence"
    | "ai_limitations"
    | "ai_confidence"
    | "recommendation_source"
    | "snapshot_at"
    | "operator_decision"
    | "decision_at"
    | "status"
    | "created_at"
>;

export type SnapshotInput = {
    zones: ZoneRow[];
    telemetry: ZoneTelemetryRow[];
    gates: GateRow[];
    gateScans: GateScanRow[];
    alerts: AlertRow[];
    selectedVenueId: string | null;
    now?: number;
};

function trend(current: number | null, previous: number | null): TrendDirection {
    if (current === null || previous === null) return "steady";
    const delta = current - previous;
    const threshold = Math.max(1, Math.abs(previous) * 0.03);
    if (delta > threshold) return "rising";
    if (delta < -threshold) return "falling";
    return "steady";
}

function zoneStatus(occupancyPercent: number | null): ZoneRiskStatus {
    if (occupancyPercent === null) return "normal";
    if (occupancyPercent >= 90) return "critical";
    if (occupancyPercent >= 75) return "watch";
    return "normal";
}

function latestTwo<T extends { recorded_at: string }>(rows: T[]): [T | null, T | null] {
    const sorted = [...rows].sort(
        (a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at)
    );
    return [sorted[0] ?? null, sorted[1] ?? null];
}

function safePercent(value: number | null, capacity: number): number | null {
    if (value === null || capacity <= 0) return null;
    return Math.min(100, Math.max(0, (value / capacity) * 100));
}

export function buildOpsSnapshot(input: SnapshotInput): OpsSnapshot {
    const now = input.now ?? Date.now();
    const telemetryByZone = new Map<string, ZoneTelemetryRow[]>();
    for (const row of input.telemetry) {
        const rows = telemetryByZone.get(row.zone_id) ?? [];
        rows.push(row);
        telemetryByZone.set(row.zone_id, rows);
    }

    const alertsByZone = new Map<string, number>();
    for (const alert of input.alerts) {
        if (alert.status !== "open" || !alert.zone_id) continue;
        alertsByZone.set(alert.zone_id, (alertsByZone.get(alert.zone_id) ?? 0) + 1);
    }

    const zones: ZoneRisk[] = input.zones.map((zone) => {
        const [current, previous] = latestTwo(telemetryByZone.get(zone.id) ?? []);
        const occupancy = current?.occupancy ?? null;
        const occupancyPercent = safePercent(occupancy, zone.capacity);
        return {
            id: zone.id,
            venueId: zone.venue_id,
            label: zone.label,
            capacity: zone.capacity,
            occupancy,
            occupancyPercent,
            status: zoneStatus(occupancyPercent),
            trend: trend(current?.occupancy ?? null, previous?.occupancy ?? null),
            freshness: classifyFreshness(current?.recorded_at, now),
            recordedAt: current?.recorded_at ?? null,
            openAlertCount: alertsByZone.get(zone.id) ?? 0,
        };
    });

    const scansByGate = new Map<string, GateScanRow[]>();
    for (const row of input.gateScans) {
        const rows = scansByGate.get(row.gate_id) ?? [];
        rows.push(row);
        scansByGate.set(row.gate_id, rows);
    }

    const gates: GateMetric[] = input.gates.map((gate) => {
        const [current, previous] = latestTwo(scansByGate.get(gate.id) ?? []);
        const currentScans = current?.scan_count ?? null;
        const previousScans = previous?.scan_count ?? null;
        const changePercent =
            currentScans !== null && previousScans !== null && previousScans !== 0
                ? ((currentScans - previousScans) / previousScans) * 100
                : null;
        return {
            id: gate.id,
            venueId: gate.venue_id,
            label: gate.label,
            currentScans,
            previousScans,
            changePercent,
            trend: trend(currentScans, previousScans),
            freshness: classifyFreshness(current?.recorded_at, now),
            recordedAt: current?.recorded_at ?? null,
        };
    });

    const zoneLabels = new Map(input.zones.map((zone) => [zone.id, zone.label]));
    const alerts: AlertSummary[] = input.alerts.map((alert) => ({
        id: alert.id,
        venueId: alert.venue_id,
        zoneId: alert.zone_id,
        zoneLabel: alert.zone_id ? zoneLabels.get(alert.zone_id) ?? null : null,
        severity: alert.severity as AlertSummary["severity"],
        message: alert.message,
        aiRecommendation: alert.ai_recommendation,
        aiEvidence: alert.ai_evidence,
        aiLimitations: alert.ai_limitations,
        aiUrgency: alert.ai_urgency as AlertSummary["aiUrgency"],
        aiConfidence: alert.ai_confidence as AlertSummary["aiConfidence"],
        recommendationSource: alert.recommendation_source as AlertSummary["recommendationSource"],
        snapshotAt: alert.snapshot_at,
        operatorDecision: alert.operator_decision as AlertSummary["operatorDecision"],
        decisionAt: alert.decision_at,
        status: alert.status as AlertSummary["status"],
        createdAt: alert.created_at,
    }));

    const decisionTimeline: DecisionEvent[] = alerts
        .filter((alert): alert is AlertSummary & { operatorDecision: "accepted" | "rejected"; decisionAt: string } => Boolean(alert.operatorDecision && alert.decisionAt))
        .map((alert) => ({
            alertId: alert.id,
            venueId: alert.venueId,
            zoneLabel: alert.zoneLabel,
            decision: alert.operatorDecision,
            decidedAt: alert.decisionAt,
        }))
        .sort((a, b) => Date.parse(b.decidedAt) - Date.parse(a.decidedAt))
        .slice(0, 10);

    const observedAt = newestTimestamp([
        ...zones.map((zone) => zone.recordedAt),
        ...gates.map((gate) => gate.recordedAt),
    ]);
    const freshness: DataFreshness = classifyFreshness(observedAt, now);

    return {
        fetchedAt: new Date(now).toISOString(),
        selectedVenueId: input.selectedVenueId,
        zones,
        gates,
        alerts,
        decisionTimeline,
        freshness,
        simulationLabel: "simulated",
    };
}

import type { OpsSnapshot } from "@/lib/ops/types";

export type MatchSummary = {
    generatedAt: string;
    venue: { id: string; name: string };
    dataStatus: OpsSnapshot["freshness"]["state"];
    measured: {
        zones: Array<{
            label: string;
            occupancy: number | null;
            capacity: number;
            occupancyPercent: number | null;
            status: string;
            recordedAt: string | null;
        }>;
        gates: Array<{
            label: string;
            currentScans: number | null;
            changePercent: number | null;
            recordedAt: string | null;
        }>;
        openAlerts: number;
    };
    generatedAnalysis: {
        headline: string;
        priority: "normal" | "watch" | "critical";
        basis: string;
        source: "deterministic-summary";
    };
};

export function buildMatchSummary(
    snapshot: OpsSnapshot,
    venue: { id: string; name: string }
): MatchSummary {
    const criticalZones = snapshot.zones.filter((zone) => zone.status === "critical");
    const watchZones = snapshot.zones.filter((zone) => zone.status === "watch");
    const priority = criticalZones.length > 0 ? "critical" : watchZones.length > 0 ? "watch" : "normal";
    const headline = criticalZones.length > 0
        ? `${criticalZones.length} zone${criticalZones.length === 1 ? "" : "s"} exceeded the critical occupancy threshold.`
        : watchZones.length > 0
            ? `${watchZones.length} zone${watchZones.length === 1 ? "" : "s"} require continued monitoring.`
            : "No occupancy threshold breach was present in the measured snapshot.";

    return {
        generatedAt: snapshot.fetchedAt,
        venue,
        dataStatus: snapshot.freshness.state,
        measured: {
            zones: snapshot.zones.map((zone) => ({
                label: zone.label,
                occupancy: zone.occupancy,
                capacity: zone.capacity,
                occupancyPercent: zone.occupancyPercent,
                status: zone.status,
                recordedAt: zone.recordedAt,
            })),
            gates: snapshot.gates.map((gate) => ({
                label: gate.label,
                currentScans: gate.currentScans,
                changePercent: gate.changePercent,
                recordedAt: gate.recordedAt,
            })),
            openAlerts: snapshot.alerts.length,
        },
        generatedAnalysis: {
            headline,
            priority,
            basis: "Derived from the measured occupancy, gate, and alert snapshot; no new model call was made for this export.",
            source: "deterministic-summary",
        },
    };
}

function csvCell(value: unknown): string {
    const text = value == null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
}

export function matchSummaryCsv(summary: MatchSummary): string {
    const rows: string[][] = [
        ["section", "field", "value", "recorded_at"],
        ["summary", "venue", summary.venue.name, ""],
        ["summary", "data_status", summary.dataStatus, summary.generatedAt],
        ["summary", "open_alerts", summary.measured.openAlerts.toString(), ""],
        ["analysis", "priority", summary.generatedAnalysis.priority, summary.generatedAt],
        ["analysis", "headline", summary.generatedAnalysis.headline, summary.generatedAt],
    ];

    for (const zone of summary.measured.zones) {
        rows.push(["measured_zone", zone.label, `${zone.occupancy ?? ""}/${zone.capacity} (${zone.occupancyPercent?.toFixed(1) ?? ""}%) ${zone.status}`, zone.recordedAt ?? ""]);
    }
    for (const gate of summary.measured.gates) {
        rows.push(["measured_gate", gate.label, `${gate.currentScans ?? ""} scans; change ${gate.changePercent?.toFixed(1) ?? ""}%`, gate.recordedAt ?? ""]);
    }

    return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

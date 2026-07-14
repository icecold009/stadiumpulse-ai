import type { Database } from "@/types/database";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];

function toMs(value: string | null): number {
    if (!value) return 0;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

export function getLatestTelemetryByZone(
    telemetry: ZoneTelemetryRow[]
): Map<string, ZoneTelemetryRow> {
    const map = new Map<string, ZoneTelemetryRow>();

    for (const row of telemetry) {
        if (row.zone_id == null) continue;
        const key = String(row.zone_id);
        const current = map.get(key);
        if (!current || toMs(row.recorded_at) > toMs(current.recorded_at)) {
            map.set(key, row);
        }
    }

    return map;
}

export function getTotalOccupancyPct(
    zones: ZoneRow[],
    telemetry: ZoneTelemetryRow[]
): number {
    const latestByZone = getLatestTelemetryByZone(telemetry);

    let totalCapacity = 0;
    let totalOccupancy = 0;

    for (const zone of zones) {
        const capacity = zone.capacity ?? 0;
        totalCapacity += capacity;

        const latest = latestByZone.get(String(zone.id));
        totalOccupancy += latest?.occupancy ?? 0;
    }

    if (totalCapacity <= 0) return 0;
    return (totalOccupancy / totalCapacity) * 100;
}
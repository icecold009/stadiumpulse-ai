"use client";

import { useMemo } from "react";
import type { Database } from "@/types/database";
import { useRealtimeZoneTelemetry } from "@/hooks/use-realtime-zone-telemetry";
import { getLatestTelemetryByZone } from "@/components/dashboard/lib/telemetry-utils";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];

type ZoneHeatmapProps = {
    initialZones: ZoneRow[];
    initialTelemetry: ZoneTelemetryRow[];
};

function getOccupancyPct(occupancy: number, capacity: number): number {
    if (!capacity || capacity <= 0) return 0;
    return (occupancy / capacity) * 100;
}

function getStatusClasses(occupancyPct: number): string {
    if (occupancyPct < 60) return "border-green-300 bg-green-50 text-green-900";
    if (occupancyPct <= 85) return "border-yellow-300 bg-yellow-50 text-yellow-900";
    return "border-red-300 bg-red-50 text-red-900";
}

export default function ZoneHeatmap({
    initialZones,
    initialTelemetry,
}: ZoneHeatmapProps) {
    const liveTelemetry = useRealtimeZoneTelemetry(initialTelemetry);

    const latestByZoneId = useMemo(
        () => getLatestTelemetryByZone(liveTelemetry),
        [liveTelemetry]
    );

    return (
        <section className="w-full">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {initialZones.map((zone) => {
                    const latest = latestByZoneId.get(String(zone.id));
                    const occupancy = latest?.occupancy ?? 0;
                    const capacity = zone.capacity ?? 0;
                    const occupancyPct = getOccupancyPct(occupancy, capacity);

                    return (
                        <article
                            key={String(zone.id)}
                            className={`rounded-lg border p-4 shadow-sm ${getStatusClasses(occupancyPct)}`}
                        >
                            <h3 className="text-base font-semibold">{zone.label}</h3>
                            <div className="mt-3 space-y-1 text-sm">
                                <p>
                                    <span className="font-medium">Occupancy:</span> {occupancy}
                                </p>
                                <p>
                                    <span className="font-medium">Capacity:</span> {capacity}
                                </p>
                                <p>
                                    <span className="font-medium">Occupancy %:</span> {occupancyPct.toFixed(1)}%
                                </p>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
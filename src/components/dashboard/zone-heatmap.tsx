"use client";

import { useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import type { Database } from "@/types/database";
import { useRealtimeZoneTelemetry } from "@/hooks/use-realtime-zone-telemetry";
import { getLatestTelemetryByZone } from "@/components/dashboard/lib/telemetry-utils";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];

type ZoneHeatmapProps = {
    initialZones: ZoneRow[];
    initialTelemetry: ZoneTelemetryRow[];
};

type ZoneStatus = "Normal" | "Watch" | "Critical";

const positionClasses = [
    "col-start-2 row-start-1",
    "col-start-3 row-start-2",
    "col-start-2 row-start-3",
    "col-start-1 row-start-2",
    "col-start-1 row-start-1",
    "col-start-3 row-start-3",
];

function getOccupancyPct(occupancy: number, capacity: number): number {
    if (!capacity || capacity <= 0) return 0;
    return Math.min((occupancy / capacity) * 100, 999);
}

function getStatus(occupancyPct: number): ZoneStatus {
    if (occupancyPct < 60) return "Normal";
    if (occupancyPct <= 85) return "Watch";
    return "Critical";
}

function getStatusClasses(status: ZoneStatus): string {
    if (status === "Normal") {
        return "border-sky-400/40 bg-sky-400/10 text-sky-100";
    }
    if (status === "Watch") {
        return "border-status-warn/55 bg-status-warn/10 text-amber-100";
    }
    return "border-status-critical/60 bg-status-critical/12 text-red-100";
}

function getShortLabel(label: string): string {
    return label.split(/\s+[—–-]\s+/)[0]?.trim() || label;
}

function StadiumDiagram({
    zones,
    latestByZoneId,
}: {
    zones: ZoneRow[];
    latestByZoneId: Map<string, ZoneTelemetryRow>;
}) {
    return (
        <div className="relative mx-auto aspect-[1.12/1] w-full max-w-[360px] rounded-[42%] border border-border/90 bg-[#0d141a] p-5 shadow-[inset_0_0_36px_rgba(61,214,196,0.04)] sm:p-6">
            <div className="grid h-full grid-cols-[1fr_1.15fr_1fr] grid-rows-[1fr_1.15fr_1fr] gap-2">
                {zones.slice(0, 6).map((zone, index) => {
                    const latest = latestByZoneId.get(String(zone.id));
                    const occupancy = latest?.occupancy ?? 0;
                    const occupancyPct = getOccupancyPct(occupancy, zone.capacity ?? 0);
                    const status = getStatus(occupancyPct);

                    return (
                        <article
                            key={String(zone.id)}
                            title={zone.label}
                            aria-label={`${zone.label}: ${occupancyPct.toFixed(0)} percent occupied, ${status}`}
                            className={`${positionClasses[index]} flex min-w-0 flex-col items-center justify-center rounded-xl border px-1.5 py-1 text-center ${getStatusClasses(status)}`}
                        >
                            <h3 className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                                {getShortLabel(zone.label)}
                            </h3>
                            <p className="font-mono text-sm font-semibold leading-tight sm:text-base">
                                {occupancyPct.toFixed(0)}%
                            </p>
                            <p className="text-[9px] leading-tight opacity-75 sm:text-[10px]">{status}</p>
                        </article>
                    );
                })}

                <div className="col-start-2 row-start-2 flex items-center justify-center rounded-[35%] border border-accent/35 bg-accent/8 p-2">
                    <div className="flex h-full w-full items-center justify-center rounded-[32%] border border-dashed border-accent/25 bg-[#10231f]">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent/75">
                            Pitch
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
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

    const zonesByVenue = useMemo(() => {
        const groups = new Map<string, ZoneRow[]>();
        for (const zone of initialZones) {
            const venueId = String(zone.venue_id);
            groups.set(venueId, [...(groups.get(venueId) ?? []), zone]);
        }
        return [...groups.values()];
    }, [initialZones]);

    return (
        <section
            className="h-full rounded-2xl border border-border bg-surface-raised p-5"
            aria-labelledby="stadium-spatial-heading"
        >
            <div className="flex items-start gap-3">
                <span className="rounded-lg border border-accent/25 bg-accent/10 p-2 text-accent">
                    <MapIcon aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                    <h2 id="stadium-spatial-heading" className="font-semibold">
                        Stadium spatial view
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-text-muted">
                        Live simulated occupancy by zone
                    </p>
                </div>
            </div>

            {zonesByVenue.length > 0 ? (
                <div className="mt-5 space-y-5">
                    {zonesByVenue.map((zones) => (
                        <StadiumDiagram
                            key={String(zones[0]?.venue_id)}
                            zones={zones}
                            latestByZoneId={latestByZoneId}
                        />
                    ))}
                </div>
            ) : (
                <p className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
                    No zone telemetry is available.
                </p>
            )}

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-text-muted" aria-hidden="true">
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-sky-400" />Normal</span>
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-status-warn" />Watch</span>
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-status-critical" />Critical</span>
            </div>
        </section>
    );
}

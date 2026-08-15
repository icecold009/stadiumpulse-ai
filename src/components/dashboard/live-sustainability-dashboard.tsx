"use client";

import { useMemo } from "react";
import EmptyState from "@/components/ui/empty-state";
import MetricGaugeGrid from "@/components/dashboard/metric-gauge-grid";
import SustainabilityTrend from "@/components/dashboard/sustainability-trend";
import { useRealtimeSustainability } from "@/hooks/use-realtime-sustainability";
import type { Database } from "@/types/database";

type VenueRow = Database["public"]["Tables"]["venues"]["Row"];
type SustainabilityRow =
    Database["public"]["Tables"]["sustainability_metrics"]["Row"];
type MetricType = "energy_kwh" | "water_l" | "waste_diverted_pct";

const METRIC_TYPES: MetricType[] = [
    "energy_kwh",
    "water_l",
    "waste_diverted_pct",
];

function isMetricType(value: string): value is MetricType {
    return METRIC_TYPES.includes(value as MetricType);
}

export default function LiveSustainabilityDashboard({
    venues,
    initialData,
}: {
    venues: VenueRow[];
    initialData: SustainabilityRow[];
}) {
    const rows = useRealtimeSustainability(initialData);

    const venueSections = useMemo(() => {
        return venues.map((venue) => {
            const venueRows = rows.filter((row) => row.venue_id === venue.id);
            const latestByType = new Map<MetricType, SustainabilityRow>();

            for (const row of venueRows) {
                if (!isMetricType(row.metric_type)) continue;
                const current = latestByType.get(row.metric_type);
                if (
                    !current ||
                    new Date(row.recorded_at).getTime() >
                        new Date(current.recorded_at).getTime()
                ) {
                    latestByType.set(row.metric_type, row);
                }
            }

            const gauges = METRIC_TYPES.flatMap((metricType) => {
                const row = latestByType.get(metricType);
                if (!row) return [];
                return [
                    {
                        label: metricType,
                        value: row.value,
                        target: row.target,
                        lowerIsBetter: metricType !== "waste_diverted_pct",
                        unit:
                            metricType === "energy_kwh"
                                ? "kWh"
                                : metricType === "water_l"
                                  ? "L"
                                  : "%",
                    },
                ];
            });

            const trendData = venueRows
                .filter(
                    (row): row is SustainabilityRow & { metric_type: MetricType } =>
                        isMetricType(row.metric_type)
                )
                .map((row) => ({
                    metric_type: row.metric_type,
                    value: row.value,
                    target: row.target,
                    recorded_at: row.recorded_at,
                }))
                .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

            const projections = METRIC_TYPES.flatMap((metricType) => {
                const points = trendData.filter((point) => point.metric_type === metricType);
                if (points.length < 2) return [];
                const current = points.at(-1)!;
                const previous = points.at(-2)!;
                const projectedValue = current.value + (current.value - previous.value);
                const lowerIsBetter = metricType !== "waste_diverted_pct";
                const projectedBreach = lowerIsBetter
                    ? projectedValue > current.target
                    : projectedValue < current.target;
                return [{
                    metricType,
                    projectedValue,
                    target: current.target,
                    projectedBreach,
                }];
            });

            return { venue, gauges, trendData, projections };
        });
    }, [rows, venues]);

    if (venues.length === 0) {
        return (
            <EmptyState
                title="No venues configured"
                description="Apply the reference seed migration before generating sustainability metrics."
            />
        );
    }

    if (rows.length === 0) {
        return (
            <EmptyState
                title="No sustainability metrics yet"
                description="Run a simulation tick after applying the venue seed to generate energy, water, and waste metrics."
            />
        );
    }

    return (
        <div className="space-y-8">
            {venueSections.map(({ venue, gauges, trendData, projections }) => (
                <section key={venue.id} className="space-y-5" aria-labelledby={`venue-${venue.id}`}>
                    <div>
                        <h2 id={`venue-${venue.id}`} className="text-xl font-semibold">
                            {venue.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">{venue.city}</p>
                    </div>
                    {gauges.length > 0 ? (
                        <MetricGaugeGrid metrics={gauges} />
                    ) : (
                        <EmptyState
                            title="No metrics for this venue"
                            description="The venue exists, but no valid sustainability metric rows are available yet."
                        />
                    )}
                    <section className="rounded-2xl border border-border bg-surface/40 p-4" aria-labelledby={`projection-${venue.id}`}>
                        <h3 id={`projection-${venue.id}`} className="text-sm font-semibold">Projected next-reading checks</h3>
                        <p className="mt-1 text-xs text-muted-foreground">A transparent linear estimate from the latest two simulated readings; it is not a model forecast.</p>
                        {projections.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Projection unavailable until two readings exist for a metric.</p> : <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                            {projections.map((projection) => <li key={projection.metricType} className="rounded-xl border border-border bg-background/30 p-3 text-xs">
                                <p className="font-semibold">{projection.metricType}</p>
                                <p className="mt-1 text-muted-foreground">Projected {projection.projectedValue.toFixed(1)} vs target {projection.target.toFixed(1)}</p>
                                <p className={`mt-2 font-semibold ${projection.projectedBreach ? "text-status-warn" : "text-status-ok"}`}>{projection.projectedBreach ? "Potential threshold breach" : "Within threshold"}</p>
                            </li>)}
                        </ul>}
                    </section>
                    <SustainabilityTrend
                        title={`${venue.name} sustainability trend`}
                        initialData={trendData}
                    />
                </section>
            ))}
        </div>
    );
}

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
                }));

            return { venue, gauges, trendData };
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
            {venueSections.map(({ venue, gauges, trendData }) => (
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
                    <SustainabilityTrend
                        title={`${venue.name} sustainability trend`}
                        initialData={trendData}
                    />
                </section>
            ))}
        </div>
    );
}

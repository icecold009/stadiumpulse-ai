"use client";

import { useMemo } from "react";
import EmptyState from "@/components/ui/empty-state";
import MetricGaugeGrid from "@/components/dashboard/metric-gauge-grid";
import { useRealtimeVolunteers } from "@/hooks/use-realtime-volunteers";
import type { Database } from "@/types/database";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];

export default function VolunteerDeploymentSummary({
    initialVolunteers,
    zones,
}: {
    initialVolunteers: VolunteerRow[];
    zones: ZoneRow[];
}) {
    const volunteers = useRealtimeVolunteers(initialVolunteers);

    const { gauges, assignments } = useMemo(() => {
        const assigned = volunteers.filter(
            (volunteer) => volunteer.status === "assigned"
        ).length;
        const available = volunteers.filter(
            (volunteer) => volunteer.status === "available"
        ).length;
        const zoneLabels = new Map(zones.map((zone) => [zone.id, zone.label]));

        const counts = new Map<string, number>();
        for (const volunteer of volunteers) {
            const label = volunteer.zone_id
                ? zoneLabels.get(volunteer.zone_id) ?? "Unknown zone"
                : "Unassigned pool";
            counts.set(label, (counts.get(label) ?? 0) + 1);
        }

        return {
            gauges: [
                {
                    label: "Assigned Volunteers",
                    value: assigned,
                    target: Math.max(volunteers.length, 1),
                    unit: "",
                },
                {
                    label: "Available Volunteers",
                    value: available,
                    target: Math.max(volunteers.length, 1),
                    unit: "",
                },
            ],
            assignments: Array.from(counts.entries()).sort((a, b) =>
                a[0].localeCompare(b[0])
            ),
        };
    }, [volunteers, zones]);

    if (volunteers.length === 0) {
        return (
            <EmptyState
                title="No volunteers found"
                description="Apply the demo volunteer seed or add volunteers before planning zone deployment."
            />
        );
    }

    return (
        <div className="space-y-6">
            <MetricGaugeGrid metrics={gauges} />
            <section className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Current deployment</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {assignments.map(([label, count]) => (
                        <li key={label} className="rounded-lg border border-border p-3">
                            <p className="text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl font-semibold">{count}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

import MetricGaugeGrid from "@/components/dashboard/metric-gauge-grid";
import EmptyState from "@/components/ui/empty-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];

export default async function VolunteersPage() {
    const supabase = await createSupabaseServerClient();

    const [volunteersRes, telemetryRes] = await Promise.all([
        supabase.from("volunteers").select("id, venue_id, zone_id, name, status"),
        supabase
            .from("zone_telemetry")
            .select("zone_id, occupancy, recorded_at")
            .order("recorded_at", { ascending: false })
            .limit(5000),
    ]);

    if (volunteersRes.error || telemetryRes.error) {
        return (
            <section className="space-y-3">
                <h1 className="text-2xl font-semibold">Volunteers</h1>
                <p className="text-sm text-destructive">Failed to load volunteers data.</p>
            </section>
        );
    }

    const volunteers = (volunteersRes.data ?? []) as VolunteerRow[];
    const telemetry = (telemetryRes.data ?? []) as ZoneTelemetryRow[];

    if (volunteers.length === 0) {
        return (
            <section className="space-y-6">
                <h1 className="text-2xl font-semibold">Volunteers</h1>
                <EmptyState
                    title="No volunteers found"
                    description="No volunteer rows are available yet. Add volunteers to start tracking assigned and available counts."
                />
            </section>
        );
    }

    const assigned = volunteers.filter((v) => v.status === "assigned").length;
    const available = volunteers.filter((v) => v.status === "available").length;

    const gaugeMetrics = [
        { label: "Assigned Volunteers", value: assigned, target: volunteers.length, unit: "" },
        { label: "Available Volunteers", value: available, target: volunteers.length, unit: "" },
    ];

    const latestByZone = new Map<string, ZoneTelemetryRow>();
    for (const row of telemetry) {
        if (row.zone_id == null) continue;
        const key = String(row.zone_id);
        if (!latestByZone.has(key)) latestByZone.set(key, row);
    }

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Volunteers</h1>
            <MetricGaugeGrid metrics={gaugeMetrics} />
            <p className="text-sm text-muted-foreground">
                Latest telemetry coverage: {latestByZone.size} zones reporting.
            </p>
        </section>
    );
}

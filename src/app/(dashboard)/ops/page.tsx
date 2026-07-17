import ZoneHeatmap from "@/components/dashboard/zone-heatmap";
import MetricGaugeGrid from "@/components/dashboard/metric-gauge-grid";
import TrendLine from "@/components/dashboard/trend-line";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

export default async function OpsPage() {
    const supabase = await createSupabaseServerClient();

    const [zonesRes, telemetryRes, alertsRes, gateScansRes] = await Promise.all([
        supabase.from("zones").select("id, venue_id, label, capacity"),
        supabase
            .from("zone_telemetry")
            .select("id, zone_id, occupancy, recorded_at")
            .order("recorded_at", { ascending: false })
            .limit(5000),
        supabase
            .from("alerts")
            .select("id, venue_id, zone_id, severity, message, ai_recommendation, status, created_at, handled_by, handled_at")
            .eq("status", "open"),
        supabase.from("gate_scans").select("id, gate_id, scan_count, recorded_at").limit(100),
    ]);

    if (zonesRes.error || telemetryRes.error || alertsRes.error || gateScansRes.error) {
        return (
            <section className="space-y-3">
                <h1 className="text-2xl font-semibold">Operations</h1>
                <p className="text-sm text-destructive">Failed to load dashboard data.</p>
            </section>
        );
    }

    const zones: ZoneRow[] = (zonesRes.data ?? []) as ZoneRow[];
    const telemetry: ZoneTelemetryRow[] = (telemetryRes.data ?? []) as ZoneTelemetryRow[];
    const alerts: AlertRow[] = (alertsRes.data ?? []) as AlertRow[];
    const gateScans = gateScansRes.data ?? [];

    const latestByZoneId = new Map<ZoneRow["id"], ZoneTelemetryRow>();
    for (const row of telemetry) {
        if (row.zone_id == null || row.recorded_at == null) continue;
        const zoneId = row.zone_id as ZoneRow["id"];
        const current = latestByZoneId.get(zoneId);

        if (!current || !current.recorded_at) {
            latestByZoneId.set(zoneId, row);
            continue;
        }

        if (new Date(row.recorded_at).getTime() > new Date(current.recorded_at).getTime()) {
            latestByZoneId.set(zoneId, row);
        }
    }

    let totalCapacity = 0;
    let totalOccupancy = 0;

    for (const zone of zones) {
        totalCapacity += zone.capacity ?? 0;
        const latest = latestByZoneId.get(zone.id);
        totalOccupancy += latest?.occupancy ?? 0;
    }

    const totalOccupancyPct = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

    const gaugeMetrics = [
        { label: "Total Occupancy", value: Number(totalOccupancyPct.toFixed(1)), target: 100, unit: "%" },
        { label: "Open Alerts", value: alerts.length, target: Math.max(alerts.length, 1), unit: "" },
    ];

    const trendData = telemetry
        .filter((row) => row.zone_id != null && row.recorded_at != null)
        .map((row) => ({
            zone_id: String(row.zone_id),
            occupancy: row.occupancy ?? 0,
            recorded_at: row.recorded_at as string,
        }));

    console.log({
        zones: zones.length,
        telemetry: telemetry.length,
        alerts: alerts.length,
        totalOccupancy,
        totalCapacity,
    });

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Operations</h1>

            <MetricGaugeGrid metrics={gaugeMetrics} />
            <ZoneHeatmap initialZones={zones} initialTelemetry={telemetry} />
            <TrendLine title="Occupancy Trend" initialData={trendData} hoursBack={24} />

            <section className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Gate Throughput Trend</h2>
                {gateScans.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No gate_scans rows found yet.</p>
                ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                        Loaded {gateScans.length} recent gate scan rows. A time-based throughput chart is pending
                        confirmation of the timestamp column to use for ordering.
                    </p>
                )}
            </section>

            <section className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">AI Resource Allocation Advisor</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Advisor panel wiring is pending model/recommendation output source in the current schema.
                    No synthetic recommendations are shown.
                </p>
            </section>
        </section>
    );
}

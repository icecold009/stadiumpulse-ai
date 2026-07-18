import ZoneHeatmap from "@/components/dashboard/zone-heatmap";
import LiveMetricGaugeGrid from "@/components/dashboard/live-metric-gauge-grid";
import TrendLine from "@/components/dashboard/trend-line";
import GateThroughputTrend from "@/components/dashboard/gate-throughput-trend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type GateRow = Database["public"]["Tables"]["gates"]["Row"];
type GateScanRow = Database["public"]["Tables"]["gate_scans"]["Row"];

export default async function OpsPage() {
    const supabase = await createSupabaseServerClient();

    const [zonesRes, telemetryRes, alertsRes, gatesRes, gateScansRes] = await Promise.all([
        supabase.from("zones").select("id, venue_id, label, capacity"),
        supabase
            .from("zone_telemetry")
            .select("id, zone_id, occupancy, recorded_at")
            .order("recorded_at", { ascending: false })
            .limit(5000),
        supabase
            .from("alerts")
            .select("id, venue_id, zone_id, severity, message, ai_recommendation, ai_urgency, ai_evidence, ai_limitations, ai_confidence, recommendation_source, snapshot_at, operator_decision, decision_by, decision_at, status, created_at, handled_by, handled_at")
            .eq("status", "open"),
        supabase.from("gates").select("id, venue_id, label"),
        supabase
            .from("gate_scans")
            .select("id, gate_id, scan_count, recorded_at")
            .order("recorded_at", { ascending: false })
            .limit(500),
    ]);

    if (zonesRes.error || telemetryRes.error || alertsRes.error || gatesRes.error || gateScansRes.error) {
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
    const gates = (gatesRes.data ?? []) as GateRow[];
    const gateScans = (gateScansRes.data ?? []) as GateScanRow[];
    const gateLabels = Object.fromEntries(gates.map((gate) => [gate.id, gate.label]));

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Operations</h1>

            <LiveMetricGaugeGrid
                mode="ops"
                initialZones={zones}
                initialTelemetry={telemetry}
                initialAlerts={alerts}
            />
            <ZoneHeatmap initialZones={zones} initialTelemetry={telemetry} />
            <TrendLine title="Occupancy Trend" initialData={telemetry} hoursBack={24} />
            <GateThroughputTrend initialData={gateScans} gateLabels={gateLabels} />
        </section>
    );
}

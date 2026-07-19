import ZoneHeatmap from "@/components/dashboard/zone-heatmap";
import LiveMetricGaugeGrid from "@/components/dashboard/live-metric-gauge-grid";
import TrendLine from "@/components/dashboard/trend-line";
import GateThroughputTrend from "@/components/dashboard/gate-throughput-trend";
import ResourceAdvisorPanel from "@/components/dashboard/resource-advisor-panel";
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
            .limit(500),
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
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Venue command</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Operations overview</h1>
                    <p className="mt-1 text-sm text-text-muted">Live venue conditions, emerging risks, and human-reviewed recommendations.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-status-ok/25 bg-status-ok/8 px-3 py-1.5 text-xs font-medium text-status-ok">
                    <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-status-ok" /> Systems live
                </span>
            </div>

            <LiveMetricGaugeGrid
                mode="ops"
                initialZones={zones}
                initialTelemetry={telemetry}
                initialAlerts={alerts}
            />
            <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)]">
                <ResourceAdvisorPanel />
                <ZoneHeatmap initialZones={zones} initialTelemetry={telemetry} />
            </div>
            <TrendLine title="Occupancy Trend" initialData={telemetry} hoursBack={24} />
            <GateThroughputTrend initialData={gateScans} gateLabels={gateLabels} />
        </section>
    );
}

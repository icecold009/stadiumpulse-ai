import { createSupabaseServerClient } from "@/lib/supabase/server";
import RealtimePageRefresh from "@/components/realtime-page-refresh";
import type { Database } from "@/types/database";
import Link from "next/link";
import { resolveVenueScope } from "@/lib/auth/venue-scope";
import { PageHeader, Panel } from "@/components/ui/primitives";

type VenueRow = Database["public"]["Tables"]["venues"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type SustainabilityRow = Database["public"]["Tables"]["sustainability_metrics"]["Row"];

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ venueId?: string }> }) {
    const supabase = await createSupabaseServerClient();
    const scopeResult = await resolveVenueScope((await searchParams).venueId);
    if (!scopeResult.ok) {
        return <section className="space-y-3"><PageHeader eyebrow="Venue intelligence" title="Overview" /><p className="text-sm text-status-critical">{scopeResult.error}</p></section>;
    }
    const venueIds = scopeResult.scope.queryVenueIds;

    const [venuesRes, zonesRes, alertsRes, sustainabilityRes] = await Promise.all([
        supabase.from("venues").select("*").in("id", venueIds),
        supabase.from("zones").select("id, venue_id, capacity").in("venue_id", venueIds),
        supabase
            .from("alerts")
            .select("id, venue_id, zone_id, severity, message, ai_recommendation, ai_urgency, ai_evidence, ai_limitations, ai_confidence, recommendation_source, snapshot_at, operator_decision, decision_by, decision_at, status, created_at, handled_by, handled_at")
            .in("venue_id", venueIds),
        supabase
            .from("sustainability_metrics")
            .select("*")
            .in("venue_id", venueIds)
            .order("recorded_at", { ascending: false })
            .limit(500),
    ]);

    const zoneIds = (zonesRes.data ?? []).map((zone) => zone.id);
    const telemetryRes = zoneIds.length > 0
        ? await supabase
            .from("zone_telemetry")
            .select("zone_id, occupancy, recorded_at")
            .in("zone_id", zoneIds)
            .order("recorded_at", { ascending: false })
            .limit(500)
        : { data: [], error: null };

    if (venuesRes.error || zonesRes.error || telemetryRes.error || alertsRes.error || sustainabilityRes.error) {
        return (
            <section className="space-y-3">
                <PageHeader eyebrow="Venue intelligence" title="Overview" />
                <p className="text-sm text-destructive">Failed to load admin overview data.</p>
            </section>
        );
    }

    const venues = (venuesRes.data ?? []) as VenueRow[];
    const zones = (zonesRes.data ?? []) as ZoneRow[];
    const telemetry = (telemetryRes.data ?? []) as ZoneTelemetryRow[];
    const alerts = (alertsRes.data ?? []) as AlertRow[];
    const sustainability = (sustainabilityRes.data ?? []) as SustainabilityRow[];

    const zonesByVenue = new Map<string, ZoneRow[]>();
    const zoneToVenue = new Map<string, string>();
    for (const z of zones) {
        const venueId = String(z.venue_id);
        const zoneId = String(z.id);
        zoneToVenue.set(zoneId, venueId);
        zonesByVenue.set(venueId, [...(zonesByVenue.get(venueId) ?? []), z]);
    }

    const latestByZone = new Map<string, ZoneTelemetryRow>();
    for (const row of telemetry) {
        if (row.zone_id == null) continue;
        const key = String(row.zone_id);
        const current = latestByZone.get(key);
        if (!current || new Date(row.recorded_at ?? 0).getTime() > new Date(current.recorded_at ?? 0).getTime()) {
            latestByZone.set(key, row);
        }
    }

    const openAlertsByVenue = new Map<string, number>();
    for (const a of alerts) {
        if (a.status !== "open") continue;

        if (a.venue_id != null) {
            const key = String(a.venue_id);
            openAlertsByVenue.set(key, (openAlertsByVenue.get(key) ?? 0) + 1);
            continue;
        }

        if (a.zone_id != null) {
            const venueId = zoneToVenue.get(String(a.zone_id));
            if (!venueId) continue;
            openAlertsByVenue.set(venueId, (openAlertsByVenue.get(venueId) ?? 0) + 1);
        }
    }

    const latestSustainabilityByVenueType = new Map<string, SustainabilityRow>();
    for (const row of sustainability) {
        const venueId = (row as { venue_id?: string | null }).venue_id;
        if (!venueId) continue;
        const key = `${venueId}::${row.metric_type}`;
        const current = latestSustainabilityByVenueType.get(key);
        if (!current || new Date(row.recorded_at ?? 0).getTime() > new Date(current.recorded_at ?? 0).getTime()) {
            latestSustainabilityByVenueType.set(key, row);
        }
    }

    return (
        <section className="space-y-7">
            <RealtimePageRefresh
                tables={["zone_telemetry", "alerts", "sustainability_metrics"]}
            />
            <PageHeader eyebrow="Venue intelligence" title="Venue overview" description="A cross-venue read on crowd pressure, active incidents, and sustainability performance." />

            {venues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No venues found.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {venues.map((venue) => {
                        const venueId = String(venue.id);
                        const venueZones = zonesByVenue.get(venueId) ?? [];

                        let totalCapacity = 0;
                        let totalOccupancy = 0;

                        for (const zone of venueZones) {
                            totalCapacity += zone.capacity ?? 0;
                            totalOccupancy += latestByZone.get(String(zone.id))?.occupancy ?? 0;
                        }

                        const occupancyPct = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;
                        const openAlerts = openAlertsByVenue.get(venueId) ?? 0;

                        const sRows = ["energy_kwh", "water_l", "waste_diverted_pct"]
                            .map((metricType) => latestSustainabilityByVenueType.get(`${venueId}::${metricType}`))
                            .filter(Boolean) as SustainabilityRow[];

                        let sustainabilityPct: number | null = null;
                        if (sRows.length > 0) {
                            const ratios = sRows
                                .map((r) => ((r.target ?? 0) > 0 ? ((r.value ?? 0) / (r.target ?? 1)) * 100 : null))
                                .filter((v): v is number => v !== null);
                            if (ratios.length > 0) sustainabilityPct = ratios.reduce((a, b) => a + b, 0) / ratios.length;
                        }

                        return (
                            <Panel as="article" key={venueId} className="group p-5 transition-[border-color,background-color,transform] duration-160 hover:-translate-y-0.5 hover:border-accent-strong/55 hover:bg-surface-raised">
                                <Link href={`/ops?venueId=${venueId}`} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                                    <div className="flex items-start justify-between gap-3">
                                        <h2 className="text-lg font-semibold tracking-[-0.03em]">
                                        {(venue as { name?: string }).name || `Venue ${venueId}`}
                                        </h2>
                                        <span className="text-xs font-semibold text-accent-strong">Open →</span>
                                    </div>
                                    <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
                                        <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-subtle">Occupancy</p><p className="mono-data mt-1 text-lg font-semibold">{occupancyPct.toFixed(1)}%</p></div>
                                        <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-subtle">Open alerts</p><p className={`mono-data mt-1 text-lg font-semibold ${openAlerts > 0 ? "text-status-warn" : "text-status-ok"}`}>{openAlerts}</p></div>
                                        <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-subtle">Sustainability</p><p className="mono-data mt-1 text-lg font-semibold">{sustainabilityPct == null ? "—" : `${sustainabilityPct.toFixed(0)}%`}</p></div>
                                    </div>
                                </Link>
                                <a href={`/api/reports/match-summary?venueId=${venueId}&format=csv`} className="control mt-5 inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong/60">
                                    Download match summary <span aria-hidden="true">↓</span>
                                </a>
                            </Panel>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

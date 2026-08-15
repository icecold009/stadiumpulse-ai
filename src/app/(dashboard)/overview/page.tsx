import { createSupabaseServerClient } from "@/lib/supabase/server";
import RealtimePageRefresh from "@/components/realtime-page-refresh";
import type { Database } from "@/types/database";
import Link from "next/link";
import { resolveVenueScope } from "@/lib/auth/venue-scope";

type VenueRow = Database["public"]["Tables"]["venues"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type SustainabilityRow = Database["public"]["Tables"]["sustainability_metrics"]["Row"];

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ venueId?: string }> }) {
    const supabase = await createSupabaseServerClient();
    const scopeResult = await resolveVenueScope((await searchParams).venueId);
    if (!scopeResult.ok) {
        return <section className="space-y-3"><h1 className="text-2xl font-semibold">Overview</h1><p className="text-sm text-status-critical">{scopeResult.error}</p></section>;
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
                <h1 className="text-2xl font-semibold">Overview</h1>
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
        <section className="space-y-6">
            <RealtimePageRefresh
                tables={["zone_telemetry", "alerts", "sustainability_metrics"]}
            />
            <h1 className="text-2xl font-semibold">Overview</h1>

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
                            <article key={venueId} className="rounded-2xl border border-border bg-surface/65 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/45 hover:bg-surface">
                                <Link href={`/ops?venueId=${venueId}`} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                                    <h2 className="text-lg font-semibold">
                                        {(venue as { name?: string }).name || `Venue ${venueId}`}
                                    </h2>
                                    <div className="mt-3 space-y-1 text-sm">
                                        <p>
                                            <span className="font-medium">Occupancy:</span> {occupancyPct.toFixed(1)}%
                                        </p>
                                        <p>
                                            <span className="font-medium">Open alerts:</span> {openAlerts}
                                        </p>
                                        <p>
                                            <span className="font-medium">Sustainability:</span>{" "}
                                            {sustainabilityPct == null ? "N/A" : `${sustainabilityPct.toFixed(1)}% of target`}
                                        </p>
                                    </div>
                                    <p className="mt-4 text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">Open operations view →</p>
                                </Link>
                                <a href={`/api/reports/match-summary?venueId=${venueId}&format=csv`} className="mt-3 inline-block text-xs font-semibold text-text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                                    Download match summary ↓
                                </a>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

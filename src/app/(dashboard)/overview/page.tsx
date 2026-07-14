import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type VenueRow = Database["public"]["Tables"]["venues"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type SustainabilityRow = Database["public"]["Tables"]["sustainability_metrics"]["Row"];

export default async function OverviewPage() {
    const supabase = await createSupabaseServerClient();

    const [venuesRes, zonesRes, telemetryRes, alertsRes, sustainabilityRes] = await Promise.all([
        supabase.from("venues").select("*"),
        supabase.from("zones").select("id, venue_id, capacity"),
        supabase
            .from("zone_telemetry")
            .select("zone_id, occupancy, recorded_at")
            .order("recorded_at", { ascending: false })
            .limit(5000),
        supabase
            .from("alerts")
            .select("id, venue_id, zone_id, severity, message, ai_recommendation, status, created_at, handled_by, handled_at"),
        supabase
            .from("sustainability_metrics")
            .select("*")
            .order("recorded_at", { ascending: false })
            .limit(5000),
    ]);

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
                            <article key={venueId} className="rounded-lg border p-4 shadow-sm">
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
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

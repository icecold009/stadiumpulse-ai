import VolunteerDeploymentSummary from "@/components/dashboard/volunteer-deployment-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveVenueScope } from "@/lib/auth/venue-scope";
import type { Database } from "@/types/database";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];

export default async function VolunteersPage({ searchParams }: { searchParams: Promise<{ venueId?: string }> }) {
    const supabase = await createSupabaseServerClient();
    const params = await searchParams;
    const scopeResult = await resolveVenueScope(params.venueId);
    if (!scopeResult.ok) {
        return <section className="space-y-3"><h1 className="text-2xl font-semibold">Volunteers</h1><p className="text-sm text-status-critical">{scopeResult.error}</p></section>;
    }
    const venueIds = scopeResult.scope.queryVenueIds;

    const [volunteersRes, zonesRes] = await Promise.all([
        supabase.from("volunteers").select("id, venue_id, zone_id, name, status").in("venue_id", venueIds),
        supabase.from("zones").select("id, venue_id, label, capacity").in("venue_id", venueIds),
    ]);

    if (volunteersRes.error || zonesRes.error) {
        return (
            <section className="space-y-3">
                <h1 className="text-2xl font-semibold">Volunteers</h1>
                <p className="text-sm text-destructive">Failed to load volunteers data.</p>
            </section>
        );
    }

    const volunteers = (volunteersRes.data ?? []) as VolunteerRow[];
    const zones = (zonesRes.data ?? []) as ZoneRow[];
    const zoneIds = zones.map((zone) => zone.id);
    const telemetryResult = zoneIds.length > 0
        ? await supabase
            .from("zone_telemetry")
            .select("zone_id, occupancy, recorded_at")
            .in("zone_id", zoneIds)
            .order("recorded_at", { ascending: false })
            .limit(500)
        : { data: [], error: null };
    if (telemetryResult.error) {
        return <section className="space-y-3"><h1 className="text-2xl font-semibold">Volunteers</h1><p className="text-sm text-destructive">Failed to load volunteer coverage data.</p></section>;
    }
    const telemetry = (telemetryResult.data ?? []) as ZoneTelemetryRow[];

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Volunteers</h1>
            <VolunteerDeploymentSummary
                initialVolunteers={volunteers}
                zones={zones}
                telemetry={telemetry}
            />
        </section>
    );
}

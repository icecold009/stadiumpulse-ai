import VolunteerDeploymentSummary from "@/components/dashboard/volunteer-deployment-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];

export default async function VolunteersPage() {
    const supabase = await createSupabaseServerClient();

    const [volunteersRes, zonesRes] = await Promise.all([
        supabase.from("volunteers").select("id, venue_id, zone_id, name, status"),
        supabase.from("zones").select("id, venue_id, label, capacity"),
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

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Volunteers</h1>
            <VolunteerDeploymentSummary
                initialVolunteers={volunteers}
                zones={zones}
            />
        </section>
    );
}

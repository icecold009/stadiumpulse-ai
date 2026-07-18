import LiveSustainabilityDashboard from "@/components/dashboard/live-sustainability-dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SustainabilityRow = Database["public"]["Tables"]["sustainability_metrics"]["Row"];
type VenueRow = Database["public"]["Tables"]["venues"]["Row"];

export default async function SustainabilityPage() {
    const supabase = await createSupabaseServerClient();

    const [venuesResult, metricsResult] = await Promise.all([
        supabase.from("venues").select("id, name, city, capacity, created_at"),
        supabase
            .from("sustainability_metrics")
            .select("*")
            .order("recorded_at", { ascending: false })
            .limit(5000),
    ]);

    if (venuesResult.error || metricsResult.error) {
        return (
            <section className="space-y-3">
                <h1 className="text-2xl font-semibold">Sustainability</h1>
                <p className="text-sm text-destructive">Failed to load sustainability metrics.</p>
            </section>
        );
    }

    const venues = (venuesResult.data ?? []) as VenueRow[];
    const rows = (metricsResult.data ?? []) as SustainabilityRow[];

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Sustainability</h1>
            <LiveSustainabilityDashboard venues={venues} initialData={rows} />
        </section>
    );
}

import MetricGaugeGrid from "@/components/dashboard/metric-gauge-grid";
import SustainabilityTrend from "@/components/dashboard/sustainability-trend";
import EmptyState from "@/components/ui/empty-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SustainabilityRow = Database["public"]["Tables"]["sustainability_metrics"]["Row"];
type MetricType = "energy_kwh" | "water_l" | "waste_diverted_pct";

const METRIC_TYPES: MetricType[] = ["energy_kwh", "water_l", "waste_diverted_pct"];

export default async function SustainabilityPage() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("sustainability_metrics")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(5000);

    if (error) {
        return (
            <section className="space-y-3">
                <h1 className="text-2xl font-semibold">Sustainability</h1>
                <p className="text-sm text-destructive">Failed to load sustainability metrics.</p>
            </section>
        );
    }

    const rows = (data ?? []) as SustainabilityRow[];

    const latestByType = new Map<MetricType, SustainabilityRow>();
    for (const row of rows) {
        if (!METRIC_TYPES.includes(row.metric_type as MetricType)) continue;
        const type = row.metric_type as MetricType;
        const current = latestByType.get(type);

        if (!current || new Date(row.recorded_at ?? 0).getTime() > new Date(current.recorded_at ?? 0).getTime()) {
            latestByType.set(type, row);
        }
    }

    const gauges = METRIC_TYPES
        .map((type) => {
            const r = latestByType.get(type);
            if (!r) return null;
            return {
                label: type,
                value: r.value ?? 0,
                target: r.target ?? 0,
                unit: type === "energy_kwh" ? "kWh" : type === "water_l" ? "L" : "%",
            };
        })
        .filter(Boolean) as Array<{ label: string; value: number; target: number; unit: string }>;

    if (gauges.length === 0) {
        return (
            <section className="space-y-6">
                <h1 className="text-2xl font-semibold">Sustainability</h1>
                <EmptyState
                    title="No sustainability metrics yet"
                    description="No latest metric rows could be derived for energy_kwh, water_l, or waste_diverted_pct."
                />
            </section>
        );
    }

    const trendData = rows
        .filter((r) => METRIC_TYPES.includes(r.metric_type as MetricType))
        .map((r) => ({
            metric_type: r.metric_type as MetricType,
            value: r.value ?? 0,
            target: r.target ?? 0,
            recorded_at: r.recorded_at as string,
        }));

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Sustainability</h1>
            <MetricGaugeGrid metrics={gauges} />
            <SustainabilityTrend title="Sustainability Trend" initialData={trendData} />
        </section>
    );
}

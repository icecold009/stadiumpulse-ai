"use client";

import { useMemo } from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type SustainabilityPoint = {
    metric_type: "energy_kwh" | "water_l" | "waste_diverted_pct";
    value: number;
    target: number;
    recorded_at: string;
};

type SustainabilityTrendProps = {
    title: string;
    initialData: SustainabilityPoint[];
};

export default function SustainabilityTrend({
    title,
    initialData,
}: SustainabilityTrendProps) {
    const data = useMemo(() => {
        const byTime = new Map<
            string,
            {
                recorded_at: string;
                energy_kwh?: number;
                water_l?: number;
                waste_diverted_pct?: number;
            }
        >();

        for (const row of initialData) {
            const key = row.recorded_at;
            const current = byTime.get(key) ?? { recorded_at: row.recorded_at };
            current[row.metric_type] = row.value;
            byTime.set(key, current);
        }

        return Array.from(byTime.values()).sort(
            (a, b) =>
                new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );
    }, [initialData]);
    const latest = data.at(-1);
    const summary = latest
        ? `${title}. Latest values: energy ${latest.energy_kwh ?? "unavailable"} kilowatt-hours, water ${latest.water_l ?? "unavailable"} litres, waste diverted ${latest.waste_diverted_pct ?? "unavailable"} percent.`
        : `${title}. No sustainability trend data is available.`;

    return (
        <section className="panel w-full p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="eyebrow">Trend evidence</p>
                    <h3 className="mt-1.5 text-base font-semibold">{title}</h3>
                </div>
                <span className="rounded-lg border border-border bg-surface-muted/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Recorded readings</span>
            </div>

            {data.length === 0 ? (
                <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                    No sustainability trend data available.
                </div>
            ) : (
                <div className="h-70 w-full" role="img" aria-label={summary}>
                    <p className="sr-only">{summary}</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} accessibilityLayer>
                            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 6" vertical={false} />
                            <XAxis
                                dataKey="recorded_at"
                                minTickGap={24}
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                }
                                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis tick={{ fill: "var(--chart-axis)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--foreground)" }}
                                labelStyle={{ color: "var(--text-muted)" }}
                                labelFormatter={(value) =>
                                    new Date(String(value)).toLocaleString()
                                }
                            />
                            <Legend wrapperStyle={{ color: "var(--text-muted)", fontSize: 11, paddingTop: 12 }} />
                            <Line
                                type="monotone"
                                dataKey="energy_kwh"
                                name="Energy (kWh)"
                                stroke="var(--chart-brand)"
                                dot={false}
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="water_l"
                                name="Water (L)"
                                stroke="var(--chart-secondary)"
                                dot={false}
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="waste_diverted_pct"
                                name="Waste Diverted (%)"
                                stroke="var(--chart-tertiary)"
                                dot={false}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

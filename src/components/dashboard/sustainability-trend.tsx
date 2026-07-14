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

    return (
        <section className="w-full rounded-lg border p-4">
            <h3 className="mb-3 text-base font-semibold">{title}</h3>

            {data.length === 0 ? (
                <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                    No sustainability trend data available.
                </div>
            ) : (
                <div className="h-70 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="recorded_at"
                                minTickGap={24}
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                }
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) =>
                                    new Date(String(value)).toLocaleString()
                                }
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="energy_kwh"
                                name="Energy (kWh)"
                                stroke="#2563eb"
                                dot={false}
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="water_l"
                                name="Water (L)"
                                stroke="#0891b2"
                                dot={false}
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="waste_diverted_pct"
                                name="Waste Diverted (%)"
                                stroke="#16a34a"
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
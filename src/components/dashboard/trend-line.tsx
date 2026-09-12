"use client";

import { useMemo } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useRealtimeZoneTelemetry } from "@/hooks/use-realtime-zone-telemetry";
import type { Database } from "@/types/database";

type TrendPoint = Database["public"]["Tables"]["zone_telemetry"]["Row"];

type TrendLineProps = {
    title: string;
    initialData: TrendPoint[];
    zoneId?: string;
    hoursBack: number;
};

export default function TrendLine({
    title,
    initialData,
    zoneId,
    hoursBack,
}: TrendLineProps) {
    const liveData = useRealtimeZoneTelemetry(initialData);

    const data = useMemo(() => {
        const newestMs = liveData.reduce(
            (latest, row) =>
                Math.max(latest, new Date(row.recorded_at).getTime()),
            0
        );
        const cutoffMs = newestMs - Math.max(hoursBack, 0) * 60 * 60 * 1000;

        const totalsByTime = new Map<string, number>();
        for (const row of liveData) {
            if (zoneId && row.zone_id !== zoneId) continue;
            if (new Date(row.recorded_at).getTime() < cutoffMs) continue;
            totalsByTime.set(
                row.recorded_at,
                (totalsByTime.get(row.recorded_at) ?? 0) + row.occupancy
            );
        }

        return Array.from(totalsByTime.entries())
            .map(([recorded_at, occupancy]) => ({ recorded_at, occupancy }))
            .sort(
                (a, b) =>
                    new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
            )
            .map((row) => ({
                ...row,
                xLabel: new Date(row.recorded_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            }));
    }, [liveData, zoneId, hoursBack]);
    const latestPoint = data.at(-1);
    const peakOccupancy = data.reduce((peak, point) => Math.max(peak, point.occupancy), 0);
    const summary = data.length === 0
        ? `${title}. No telemetry data is available for the selected range.`
        : `${title}. ${data.length} timestamped occupancy samples from the last ${hoursBack} hours. Latest total occupancy ${latestPoint?.occupancy ?? "unavailable"} people; peak ${peakOccupancy} people.`;

    return (
        <section className="panel-raised w-full overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="eyebrow">Live telemetry</p>
                    <h3 className="mt-1 text-base font-semibold">{title}</h3>
                </div>
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-medium text-text-muted">{hoursBack}h window</span>
            </div>

            {data.length === 0 ? (
                <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                    No telemetry data available for the selected range.
                </div>
            ) : (
                <div
                    className="mt-5 h-70 w-full"
                    role="img"
                    aria-label={summary}
                >
                    <p className="sr-only">{summary}</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} accessibilityLayer>
                                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 6" vertical={false} />
                            <XAxis dataKey="xLabel" minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--foreground)" }}
                                labelStyle={{ color: "var(--text-muted)" }}
                                labelFormatter={(_, payload) => {
                                    const item = payload?.[0]?.payload as
                                        | { recorded_at?: string }
                                        | undefined;
                                    return item?.recorded_at
                                        ? new Date(item.recorded_at).toLocaleString()
                                        : "";
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="occupancy"
                                stroke="var(--chart-brand)"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4, fill: "var(--chart-brand)", stroke: "var(--canvas)", strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

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

    return (
        <section className="w-full overflow-hidden rounded-2xl border border-border bg-surface-raised/70 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Live telemetry</p>
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
                    aria-label={`${title}, showing ${data.length} live occupancy samples.`}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} accessibilityLayer>
                            <CartesianGrid stroke="#26303a" strokeDasharray="3 6" vertical={false} />
                            <XAxis dataKey="xLabel" minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: "#8b96a3", fontSize: 11 }} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#8b96a3", fontSize: 11 }} />
                            <Tooltip
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
                                stroke="#3DD6C4"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4, fill: "#3DD6C4", stroke: "#0b0f14", strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

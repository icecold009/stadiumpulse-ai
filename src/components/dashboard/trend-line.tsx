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
        <section className="w-full rounded-lg border p-4">
            <h3 className="mb-3 text-base font-semibold">{title}</h3>

            {data.length === 0 ? (
                <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                    No telemetry data available for the selected range.
                </div>
            ) : (
                <div
                    className="h-70 w-full"
                    role="img"
                    aria-label={`${title}, showing ${data.length} live occupancy samples.`}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} accessibilityLayer>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="xLabel" minTickGap={24} />
                            <YAxis allowDecimals={false} />
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
                                stroke="currentColor"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

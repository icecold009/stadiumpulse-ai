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

type TrendPoint = {
    zone_id: string;
    occupancy: number;
    recorded_at: string;
};

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
    const data = useMemo(() => {
        const nowMs = Date.now();
        const cutoffMs = nowMs - Math.max(hoursBack, 0) * 60 * 60 * 1000;

        return initialData
            .filter((row) => (zoneId ? row.zone_id === zoneId : true))
            .filter((row) => new Date(row.recorded_at).getTime() >= cutoffMs)
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
    }, [initialData, zoneId, hoursBack]);

    return (
        <section className="w-full rounded-lg border p-4">
            <h3 className="mb-3 text-base font-semibold">{title}</h3>

            {data.length === 0 ? (
                <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                    No telemetry data available for the selected range.
                </div>
            ) : (
                <div className="h-70 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="xLabel" minTickGap={24} />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                labelFormatter={(_, payload) => {
                                    const item = payload?.[0]?.payload as TrendPoint | undefined;
                                    return item
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
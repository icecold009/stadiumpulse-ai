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
import { useRealtimeGateScans } from "@/hooks/use-realtime-gate-scans";
import type { Database } from "@/types/database";

type GateScanRow = Database["public"]["Tables"]["gate_scans"]["Row"];

type GateThroughputTrendProps = {
    initialData: GateScanRow[];
    gateLabels: Record<string, string>;
};

export default function GateThroughputTrend({
    initialData,
    gateLabels,
}: GateThroughputTrendProps) {
    const liveScans = useRealtimeGateScans(initialData);

    const { points, totalScans, busiestGate } = useMemo(() => {
        const totalsByTime = new Map<string, number>();
        const totalsByGate = new Map<string, number>();

        for (const row of liveScans) {
            totalsByTime.set(
                row.recorded_at,
                (totalsByTime.get(row.recorded_at) ?? 0) + row.scan_count
            );
            totalsByGate.set(
                row.gate_id,
                (totalsByGate.get(row.gate_id) ?? 0) + row.scan_count
            );
        }

        const chartPoints = Array.from(totalsByTime.entries())
            .map(([recordedAt, scans]) => ({
                recordedAt,
                scans,
                label: new Date(recordedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
            }))
            .sort(
                (a, b) =>
                    new Date(a.recordedAt).getTime() -
                    new Date(b.recordedAt).getTime()
            );

        const busiest = Array.from(totalsByGate.entries()).sort(
            (a, b) => b[1] - a[1]
        )[0];

        return {
            points: chartPoints,
            totalScans: chartPoints.reduce((sum, point) => sum + point.scans, 0),
            busiestGate: busiest
                ? `${gateLabels[busiest[0]] ?? "Unknown gate"} (${busiest[1]} scans)`
                : "Not available",
        };
    }, [gateLabels, liveScans]);

    return (
        <section className="w-full rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Gate Throughput Trend</h2>
            <p className="sr-only">
                {points.length === 0
                    ? "No gate throughput data is available."
                    : `${totalScans} scans are shown across ${points.length} intervals. Busiest gate: ${busiestGate}.`}
            </p>

            {points.length === 0 ? (
                <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                    No gate scans yet. Run a simulation tick to generate throughput data.
                </div>
            ) : (
                <>
                    <div
                        className="mt-4 h-70 w-full"
                        role="img"
                        aria-label={`Gate throughput over time. ${totalScans} scans across ${points.length} intervals. Busiest gate: ${busiestGate}.`}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={points} accessibilityLayer>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" minTickGap={24} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    labelFormatter={(_, payload) => {
                                        const point = payload?.[0]?.payload as
                                            | { recordedAt?: string }
                                            | undefined;
                                        return point?.recordedAt
                                            ? new Date(point.recordedAt).toLocaleString()
                                            : "";
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="scans"
                                    name="Scans per interval"
                                    stroke="#3DD6C4"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Busiest gate in the displayed window: {busiestGate}
                    </p>
                </>
            )}
        </section>
    );
}

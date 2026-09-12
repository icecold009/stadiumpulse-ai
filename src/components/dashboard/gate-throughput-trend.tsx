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
        <section className="panel-raised w-full overflow-hidden p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="eyebrow">Entry flow</p>
                    <h2 className="mt-1 text-lg font-semibold">Gate throughput</h2>
                </div>
                <span className="mono-data rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text-muted">{totalScans.toLocaleString()} scans</span>
            </div>
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
                                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 6" vertical={false} />
                                <XAxis dataKey="label" minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--foreground)" }}
                                    labelStyle={{ color: "var(--text-muted)" }}
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
                                    stroke="var(--chart-brand)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: "var(--chart-brand)", stroke: "var(--canvas)", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="mt-3 rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm text-text-muted">
                        <span className="font-medium text-foreground">Peak activity:</span> {busiestGate}
                    </p>
                </>
            )}
        </section>
    );
}

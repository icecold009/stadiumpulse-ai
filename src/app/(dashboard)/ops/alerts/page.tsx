// src/app/(dashboard)/ops/alerts/page.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import type { Database } from "@/types/database";

type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

type AlertWithZone = AlertRow & {
    zones: { label: string; capacity: number } | null;
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<AlertWithZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    async function fetchAlerts() {
        const res = await fetch("/api/alerts");
        const json = await res.json();
        setAlerts(json.alerts ?? []);
        setLoading(false);
    }

    useEffect(() => {
        let cancelled = false;

        async function loadAlerts() {
            const res = await fetch("/api/alerts");
            const json = await res.json();

            if (!cancelled) {
                setAlerts(json.alerts ?? []);
                setLoading(false);
            }
        }

        void loadAlerts();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleMarkHandled(id: string) {
        startTransition(async () => {
            const res = await fetch(`/api/alerts/${id}/handle`, { method: "PATCH" });
            if (res.ok) {
                // Optimistically remove from feed
                setAlerts((prev) => prev.filter((a) => a.id !== id));
            } else {
                const json = await res.json();
                alert(`Error: ${json.error}`);
            }
        });
    }

    if (loading) return <p className="p-6 text-muted-foreground">Loading alerts…</p>;

    if (alerts.length === 0) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                <p className="text-lg font-medium">All clear</p>
                <p className="text-sm">No open alerts at this time.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-xl font-semibold">Open Alerts</h1>
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`rounded-lg border p-4 space-y-2 ${alert.severity === "critical"
                        ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                        : "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
                        }`}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span
                                className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${alert.severity === "critical"
                                    ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                                    : "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                    }`}
                            >
                                {alert.severity}
                            </span>
                            <p className="mt-1 font-medium text-sm">{alert.message}</p>
                            {alert.zones && (
                                <p className="text-xs text-muted-foreground">
                                    Zone: {alert.zones.label} · Capacity: {alert.zones.capacity}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => handleMarkHandled(alert.id)}
                            disabled={isPending}
                            className="shrink-0 text-sm px-3 py-1.5 rounded-md border bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                        >
                            Mark handled
                        </button>
                    </div>

                    {alert.ai_recommendation && (
                        <div className="rounded-md bg-white/60 dark:bg-neutral-900/60 border px-3 py-2 text-sm">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                AI Recommendation
                            </span>
                            <p className="mt-0.5 text-sm">{alert.ai_recommendation}</p>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
}
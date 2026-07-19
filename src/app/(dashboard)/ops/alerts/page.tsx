// src/app/(dashboard)/ops/alerts/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Check, CircleCheck, RefreshCw, X } from "lucide-react";
import type { Database } from "@/types/database";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

type AlertWithZone = AlertRow & {
    zones: { label: string; capacity: number } | null;
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<AlertWithZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);

    const fetchAlerts = useCallback(async () => {
        try {
            setLoadError(null);
            const res = await fetch("/api/alerts", { cache: "no-store" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Failed to load alerts.");
            setAlerts(json.alerts ?? []);
        } catch (error) {
            setLoadError(
                error instanceof Error ? error.message : "Failed to load alerts."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialLoad = setTimeout(() => void fetchAlerts(), 0);

        const channel = supabase
            .channel("ops_alert_feed_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "alerts" },
                () => void fetchAlerts()
            )
            .subscribe();

        return () => {
            clearTimeout(initialLoad);
            void supabase.removeChannel(channel);
        };
    }, [fetchAlerts, supabase]);

    async function handleFeedback(
        id: string,
        action: "accept" | "reject" | "handled"
    ) {
        startTransition(async () => {
            const res = await fetch(`/api/alerts/${id}/handle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                const json = await res.json();
                setAlerts((current) =>
                    action === "handled"
                        ? current.filter((alert) => alert.id !== id)
                        : current.map((alert) =>
                              alert.id === id ? { ...alert, ...json.alert } : alert
                          )
                );
            } else {
                const json = await res.json();
                alert(`Error: ${json.error}`);
            }
        });
    }

    if (loading) return <p className="p-6 text-muted-foreground">Loading alerts…</p>;

    if (loadError) {
        return (
            <div className="p-6 text-center text-status-critical">
                <p className="font-medium">Could not load alerts</p>
                <p className="mt-1 text-sm">{loadError}</p>
                <button
                    type="button"
                    onClick={() => void fetchAlerts()}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:border-status-critical/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical/50"
                >
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    Try again
                </button>
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                <p className="text-lg font-medium">All clear</p>
                <p className="text-sm">No open alerts at this time.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-status-warn">Incident command</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">Open alerts</h1>
                    <p className="mt-1 text-sm text-text-muted">Review evidence, decide on AI guidance, then resolve incidents separately.</p>
                </div>
                <span className="rounded-full border border-status-warn/30 bg-status-warn/8 px-3 py-1.5 font-mono text-xs text-status-warn">{alerts.length} active</span>
            </div>
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`space-y-4 rounded-2xl border bg-surface-raised/70 p-5 shadow-[0_16px_38px_rgba(0,0,0,0.12)] ${alert.severity === "critical"
                        ? "border-status-critical/45"
                        : "border-status-warn/40"
                        }`}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${alert.severity === "critical" ? "border-status-critical/30 bg-status-critical/10 text-status-critical" : "border-status-warn/30 bg-status-warn/10 text-status-warn"}`}>
                                <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                            </span>
                            <div>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${alert.severity === "critical"
                                    ? "bg-status-critical/12 text-status-critical"
                                    : "bg-status-warn/12 text-status-warn"
                                    }`}
                            >
                                {alert.severity}
                            </span>
                            <p className="mt-2 text-sm font-medium leading-6">{alert.message}</p>
                            {alert.zones && (
                                <p className="text-xs text-muted-foreground">
                                    Zone: {alert.zones.label} · Capacity: {alert.zones.capacity}
                                </p>
                            )}
                            </div>
                        </div>
                    </div>

                    {alert.ai_recommendation && (
                        <div className="rounded-2xl border border-ai-highlight/35 bg-[linear-gradient(135deg,rgba(139,92,246,0.08),rgba(20,26,33,0.75))] px-4 py-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-ai-highlight">
                                    {alert.recommendation_source === "ai"
                                        ? "AI recommendation"
                                        : "Safety fallback (AI unavailable)"}
                                </span>
                                <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                                    {alert.ai_urgency} urgency
                                </span>
                                <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                                    {alert.ai_confidence} confidence
                                </span>
                            </div>
                            <p className="mt-2 font-medium">{alert.ai_recommendation}</p>
                            {alert.operator_decision ? (
                                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">
                                    Operator {alert.operator_decision} this recommendation
                                </p>
                            ) : null}
                            <dl className="mt-3 grid gap-2 text-xs text-text-muted">
                                <div>
                                    <dt className="font-semibold text-foreground">Evidence</dt>
                                    <dd>{alert.ai_evidence || "No evidence was recorded."}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-foreground">Limitations</dt>
                                    <dd>{alert.ai_limitations}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-foreground">Snapshot</dt>
                                    <dd>{new Date(alert.snapshot_at).toLocaleString()}</dd>
                                </div>
                            </dl>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
                        <button
                            type="button"
                            onClick={() => handleFeedback(alert.id, "accept")}
                            disabled={isPending || alert.operator_decision === "accepted"}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-status-ok/45 bg-status-ok/8 px-3 text-sm font-medium text-status-ok transition hover:bg-status-ok/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-ok/50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <Check aria-hidden="true" className="h-4 w-4" />
                            Accept recommendation
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFeedback(alert.id, "reject")}
                            disabled={isPending || alert.operator_decision === "rejected"}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-status-warn/45 bg-status-warn/8 px-3 text-sm font-medium text-status-warn transition hover:bg-status-warn/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warn/50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <X aria-hidden="true" className="h-4 w-4" />
                            Reject recommendation
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFeedback(alert.id, "handled")}
                            disabled={isPending}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium transition hover:border-accent/45 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <CircleCheck aria-hidden="true" className="h-4 w-4" />
                            Mark incident handled
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
}

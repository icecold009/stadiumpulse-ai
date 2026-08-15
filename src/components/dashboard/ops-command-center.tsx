"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Gauge, MapPinned, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import DataFreshnessBadge from "@/components/dashboard/data-freshness-badge";
import GroundedRecommendationCard from "@/components/dashboard/grounded-recommendation-card";
import { recommendationFromAlert } from "@/lib/ops/recommendations";
import type { OpsSnapshot, TrendDirection } from "@/lib/ops/types";

type Props = {
    initialSnapshot: OpsSnapshot;
};

function trendIcon(direction: TrendDirection) {
    if (direction === "rising") return <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-status-warn" />;
    if (direction === "falling") return <ArrowDownRight aria-hidden="true" className="h-4 w-4 text-status-ok" />;
    return <span aria-hidden="true" className="h-4 w-4 text-text-muted">—</span>;
}

function askCopilot(context: { question: string; zoneId?: string; venueId?: string; gateId?: string; alertId?: string; metricType?: "energy_kwh" | "water_l" | "waste_diverted_pct" }) {
    window.dispatchEvent(new CustomEvent("pulseops:copilot", { detail: context }));
}

export default function OpsCommandCenter({ initialSnapshot }: Props) {
    const [snapshot, setSnapshot] = useState(initialSnapshot);
    const [error, setError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const params = new URLSearchParams({ windowMinutes: "60" });
            if (initialSnapshot.selectedVenueId) params.set("venueId", initialSnapshot.selectedVenueId);
            const response = await fetch(`/api/ops/snapshot?${params.toString()}`, { cache: "no-store" });
            const payload = (await response.json()) as { snapshot?: OpsSnapshot; error?: string };
            if (!response.ok || !payload.snapshot) throw new Error(payload.error ?? "Operations snapshot unavailable.");
            setSnapshot(payload.snapshot);
            setError("");
        } catch (refreshError) {
            setError(refreshError instanceof Error ? refreshError.message : "Operations snapshot unavailable.");
        } finally {
            setIsRefreshing(false);
        }
    }, [initialSnapshot.selectedVenueId]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const channel = supabase
            .channel("ops_command_center_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "zone_telemetry" }, () => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => void refresh(), 1_000);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "gate_scans" }, () => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => void refresh(), 1_000);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => void refresh(), 1_000);
            })
            .subscribe();

        return () => {
            if (timer) clearTimeout(timer);
            void supabase.removeChannel(channel);
        };
    }, [refresh, supabase]);

    function handleAlertAction(alertId: string, action: "accept" | "reject" | "handled") {
        startTransition(async () => {
            const response = await fetch(`/api/alerts/${alertId}/handle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (!response.ok) {
                const payload = (await response.json()) as { error?: string };
                setError(payload.error ?? "Alert decision could not be recorded.");
                return;
            }
            await refresh();
        });
    }

    const criticalZones = snapshot.zones.filter((zone) => zone.status === "critical").length;
    const watchZones = snapshot.zones.filter((zone) => zone.status === "watch").length;
    const totalOccupancy = snapshot.zones.reduce((sum, zone) => sum + (zone.occupancy ?? 0), 0);
    const totalCapacity = snapshot.zones.reduce((sum, zone) => sum + zone.capacity, 0);
    const occupancyPercent = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : null;
    const topRisks = [...snapshot.zones]
        .sort((a, b) => (b.occupancyPercent ?? -1) - (a.occupancyPercent ?? -1))
        .slice(0, 6);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Venue command center</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[30px]">Operations situation room</h1>
                    <p className="mt-1 max-w-2xl text-sm text-text-muted">Identify the highest-risk conditions, understand the evidence, and keep the operational decision human-controlled.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DataFreshnessBadge freshness={snapshot.freshness} />
                    <button type="button" onClick={() => void refresh()} disabled={isRefreshing} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-text-muted transition hover:border-accent/50 hover:text-accent disabled:opacity-50">
                        <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total occupancy" value={occupancyPercent == null ? "—" : `${occupancyPercent.toFixed(1)}%`} icon={<Users aria-hidden="true" className="h-4 w-4" />} tone={criticalZones > 0 ? "critical" : "normal"} />
                <MetricCard label="Critical zones" value={String(criticalZones)} icon={<ShieldAlert aria-hidden="true" className="h-4 w-4" />} tone={criticalZones > 0 ? "critical" : "normal"} />
                <MetricCard label="Watch zones" value={String(watchZones)} icon={<Gauge aria-hidden="true" className="h-4 w-4" />} tone={watchZones > 0 ? "warn" : "normal"} />
                <MetricCard label="Open incidents" value={String(snapshot.alerts.length)} icon={<MapPinned aria-hidden="true" className="h-4 w-4" />} tone={snapshot.alerts.length > 0 ? "warn" : "normal"} />
            </div>

            {error ? <div role="alert" className="rounded-xl border border-status-warn/40 bg-status-warn/10 px-4 py-3 text-sm text-status-warn">{error}</div> : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                <section className="rounded-2xl border border-border bg-surface/65 p-5" aria-labelledby="risk-heading">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Risk map</p>
                            <h2 id="risk-heading" className="mt-1 text-lg font-semibold">Zones needing attention</h2>
                        </div>
                        <span className="text-xs text-text-muted">{snapshot.zones.length} monitored zones</span>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {topRisks.length === 0 ? <p className="rounded-xl border border-border bg-background/30 p-4 text-sm text-text-muted">No zone telemetry is available.</p> : topRisks.map((zone) => (
                            <article key={zone.id} className="rounded-xl border border-border bg-background/35 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold">{zone.label}</h3>
                                        <p className="mt-1 text-xs text-text-muted">{zone.occupancy == null ? "No current reading" : `${zone.occupancy} / ${zone.capacity} people`}</p>
                                    </div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${zone.status === "critical" ? "border-status-critical/40 bg-status-critical/10 text-status-critical" : zone.status === "watch" ? "border-status-warn/40 bg-status-warn/10 text-status-warn" : "border-status-ok/30 bg-status-ok/10 text-status-ok"}`}>{zone.status}</span>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5 text-text-muted">{trendIcon(zone.trend)} {zone.occupancyPercent == null ? "—" : `${zone.occupancyPercent.toFixed(1)}% occupied`}</span>
                                    <button type="button" onClick={() => askCopilot({ question: `What should the operator know about ${zone.label} right now?`, zoneId: zone.id, venueId: zone.venueId })} className="font-semibold text-ai-highlight hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-highlight/60">Ask Copilot</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-surface/65 p-5" aria-labelledby="gate-heading">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Entry flow</p>
                            <h2 id="gate-heading" className="mt-1 text-lg font-semibold">Gate throughput</h2>
                        </div>
                        <span className="text-xs text-text-muted">Latest readings</span>
                    </div>
                    <div className="mt-5 space-y-3">
                        {snapshot.gates.length === 0 ? <p className="rounded-xl border border-border bg-background/30 p-4 text-sm text-text-muted">No gate readings are available.</p> : snapshot.gates.slice(0, 6).map((gate) => (
                            <div key={gate.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/35 px-3 py-3">
                                <div>
                                    <p className="text-sm font-semibold">{gate.label}</p>
                                    <p className="mt-1 text-xs text-text-muted">{gate.currentScans == null ? "No current reading" : `${gate.currentScans} scans in latest interval`}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs font-semibold">{trendIcon(gate.trend)} {gate.changePercent == null ? "—" : `${gate.changePercent >= 0 ? "+" : ""}${gate.changePercent.toFixed(0)}%`}</span>
                                    <button type="button" onClick={() => askCopilot({ question: `What should the operator know about ${gate.label} throughput right now?`, gateId: gate.id, venueId: gate.venueId })} className="text-[11px] font-semibold text-ai-highlight hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-highlight/60">Ask</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-border bg-surface/65 p-5" aria-labelledby="incident-heading">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Decision queue</p>
                        <h2 id="incident-heading" className="mt-1 text-lg font-semibold">Open incidents and recommendations</h2>
                    </div>
                    <a href={initialSnapshot.selectedVenueId ? `/ops/alerts?venueId=${initialSnapshot.selectedVenueId}` : "/ops/alerts"} className="text-xs font-semibold text-accent hover:text-foreground">Open full alert queue</a>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {snapshot.alerts.length === 0 ? <p className="rounded-xl border border-border bg-background/30 p-4 text-sm text-text-muted">No open incidents in this venue scope.</p> : snapshot.alerts.slice(0, 4).map((alert) => (
                        <GroundedRecommendationCard key={alert.id} recommendation={recommendationFromAlert(alert)} pending={isPending} onAction={(action) => handleAlertAction(alert.id, action)} onAskCopilot={() => askCopilot({ question: `What should the operator know about this ${alert.severity} alert in ${alert.zoneLabel ?? "the venue"}?`, alertId: alert.id, zoneId: alert.zoneId ?? undefined, venueId: alert.venueId })} />
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface/65 p-5" aria-labelledby="decision-heading">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Human control</p>
                        <h2 id="decision-heading" className="mt-1 text-lg font-semibold">Decision timeline</h2>
                    </div>
                    <span className="text-xs text-text-muted">Recorded operator outcomes</span>
                </div>
                {snapshot.decisionTimeline.length === 0 ? <p className="mt-4 rounded-xl border border-border bg-background/30 p-4 text-sm text-text-muted">No operator decisions recorded in the current open-alert snapshot.</p> : <ol className="mt-4 space-y-3">
                    {snapshot.decisionTimeline.map((event) => <li key={`${event.alertId}:${event.decidedAt}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/30 px-3 py-3 text-sm">
                        <span><strong>{event.decision === "accepted" ? "Accepted" : "Rejected"}</strong> recommendation{event.zoneLabel ? ` for ${event.zoneLabel}` : ""}</span>
                        <time className="text-xs text-text-muted" dateTime={event.decidedAt}>{new Date(event.decidedAt).toLocaleString()}</time>
                    </li>)}
                </ol>}
            </section>
        </div>
    );
}

function MetricCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: "normal" | "warn" | "critical" }) {
    const color = tone === "critical" ? "text-status-critical" : tone === "warn" ? "text-status-warn" : "text-accent";
    return <article className="rounded-2xl border border-border bg-surface/65 p-4"><div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${color}`}>{icon}{label}</div><p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-foreground">{value}</p></article>;
}

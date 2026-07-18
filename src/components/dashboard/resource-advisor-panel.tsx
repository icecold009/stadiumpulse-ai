"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ResourceAdvisorResult } from "@/lib/ai/resource-advisor";

export default function ResourceAdvisorPanel() {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [result, setResult] = useState<ResourceAdvisorResult | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const mounted = useRef(true);

    const loadAdvice = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/resource-advisor", {
                method: "GET",
                headers: { Accept: "application/json" },
                cache: "no-store",
            });
            const payload = (await response.json()) as
                | ResourceAdvisorResult
                | { error?: string };
            if (!response.ok) {
                throw new Error(
                    "error" in payload && payload.error
                        ? payload.error
                        : "Resource advice is unavailable."
                );
            }
            if (mounted.current) setResult(payload as ResourceAdvisorResult);
        } catch (loadError) {
            if (mounted.current) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Resource advice is unavailable."
                );
            }
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        const initialLoad = setTimeout(() => void loadAdvice(), 0);
        return () => {
            clearTimeout(initialLoad);
            mounted.current = false;
        };
    }, [loadAdvice]);

    useEffect(() => {
        let refreshTimer: ReturnType<typeof setTimeout> | null = null;
        const channel = supabase
            .channel(`resource_advisor_${subscriptionId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "zone_telemetry" },
                () => {
                    if (refreshTimer) clearTimeout(refreshTimer);
                    refreshTimer = setTimeout(() => void loadAdvice(), 2_000);
                }
            )
            .subscribe();

        return () => {
            if (refreshTimer) clearTimeout(refreshTimer);
            void supabase.removeChannel(channel);
        };
    }, [loadAdvice, subscriptionId, supabase]);

    return (
        <section
            className="rounded-2xl border border-ai-highlight/60 bg-surface-raised p-5"
            aria-labelledby="resource-advisor-heading"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ai-highlight">
                        Human-reviewed AI
                    </p>
                    <h2 id="resource-advisor-heading" className="mt-1 text-lg font-semibold">
                        Resource Allocation Advisor
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-text-muted">
                        Current and 15-minute projected occupancy inform bounded staffing suggestions. Nothing is reassigned automatically.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadAdvice()}
                    disabled={loading}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:border-ai-highlight hover:text-ai-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-highlight disabled:cursor-wait disabled:opacity-60"
                >
                    <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Refreshing" : "Refresh advice"}
                </button>
            </div>

            <div className="mt-5" aria-live="polite" aria-busy={loading}>
                {loading && !result ? (
                    <p className="text-sm text-text-muted">Generating grounded resource advice…</p>
                ) : error ? (
                    <div className="rounded-xl border border-status-warn/50 bg-status-warn/10 p-4">
                        <p className="font-medium text-status-warn">Advice unavailable</p>
                        <p className="mt-1 text-sm text-text-muted">{error}</p>
                    </div>
                ) : result ? (
                    <>
                        <div className="mb-3 flex flex-wrap gap-2 text-xs text-text-muted">
                            <span className="rounded-full border border-border px-2.5 py-1">
                                {result.source === "ai" ? "AI generated" : "Safety fallback"}
                            </span>
                            <span className="rounded-full border border-border px-2.5 py-1">
                                Snapshot {new Date(result.snapshotTime).toLocaleString()}
                            </span>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-3">
                            {result.recommendations.map((recommendation) => (
                                <article
                                    key={recommendation.zoneId}
                                    className="rounded-xl border border-border bg-surface p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold">{recommendation.zoneLabel}</h3>
                                            <p className="text-xs text-text-muted">{recommendation.venueName}</p>
                                        </div>
                                        <span className="rounded-full border border-ai-highlight/50 px-2 py-1 text-[11px] font-semibold uppercase text-ai-highlight">
                                            {recommendation.urgency}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium leading-6">{recommendation.action}</p>
                                    <dl className="mt-4 space-y-3 text-xs leading-5">
                                        <div>
                                            <dt className="font-semibold text-text-muted">Evidence</dt>
                                            <dd>{recommendation.evidence}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold text-text-muted">Rationale</dt>
                                            <dd>{recommendation.rationale}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold text-text-muted">Limitations</dt>
                                            <dd>{recommendation.limitations}</dd>
                                        </div>
                                    </dl>
                                    <p className="mt-3 text-xs text-text-muted">
                                        Confidence: {recommendation.confidence}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}

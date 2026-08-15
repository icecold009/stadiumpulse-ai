"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import type { SustainabilityAdvisorResult } from "@/lib/ai/sustainability-advisor";
import GroundedRecommendationCard from "@/components/dashboard/grounded-recommendation-card";

const METRIC_LABELS = {
    energy_kwh: "Energy",
    water_l: "Water",
    waste_diverted_pct: "Waste diversion",
} as const;

export default function SustainabilityAdvisorPanel() {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [result, setResult] = useState<SustainabilityAdvisorResult | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const venueId = searchParams.get("venueId");

    const loadAdvice = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const query = venueId ? `?venueId=${encodeURIComponent(venueId)}` : "";
            const response = await fetch(`/api/sustainability-advisor${query}`, {
                cache: "no-store",
                headers: { Accept: "application/json" },
            });
            const payload = (await response.json()) as
                | SustainabilityAdvisorResult
                | { error?: string };
            if (!response.ok) {
                throw new Error(
                    "error" in payload && payload.error
                        ? payload.error
                        : "Sustainability advice is unavailable."
                );
            }
            setResult(payload as SustainabilityAdvisorResult);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : "Sustainability advice is unavailable."
            );
        } finally {
            setLoading(false);
        }
    }, [venueId]);

    useEffect(() => {
        const initialLoad = setTimeout(() => void loadAdvice(), 0);
        return () => clearTimeout(initialLoad);
    }, [loadAdvice]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const channel = supabase
            .channel(`sustainability_advisor_${subscriptionId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "sustainability_metrics",
                },
                () => {
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(() => void loadAdvice(), 2_000);
                }
            )
            .subscribe();
        return () => {
            if (timer) clearTimeout(timer);
            void supabase.removeChannel(channel);
        };
    }, [loadAdvice, subscriptionId, supabase]);

    return (
        <section
            className="rounded-2xl border border-ai-highlight/60 bg-surface-raised p-5"
            aria-labelledby="sustainability-advisor-heading"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ai-highlight">
                        Human-reviewed AI
                    </p>
                    <h2 id="sustainability-advisor-heading" className="mt-1 text-lg font-semibold">
                        Sustainability interventions
                    </h2>
                    <p className="mt-1 text-sm text-text-muted">
                        Grounded actions target the largest current metric gaps. No equipment or vendor control is automated.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadAdvice()}
                    disabled={loading}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:border-ai-highlight hover:text-ai-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-highlight disabled:opacity-60"
                >
                    <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Refreshing" : "Refresh advice"}
                </button>
            </div>

            <div className="mt-5" aria-live="polite" aria-busy={loading}>
                {loading && !result ? (
                    <p className="text-sm text-text-muted">Generating grounded interventions…</p>
                ) : error ? (
                    <div className="rounded-xl border border-status-warn/50 bg-status-warn/10 p-4">
                        <p className="font-medium text-status-warn">Advice unavailable</p>
                        <p className="mt-1 text-sm text-text-muted">{error}</p>
                    </div>
                ) : result ? (
                    <>
                        <p className="mb-3 text-xs text-text-muted">
                            {result.source === "ai" ? "AI generated" : "Safety fallback"} · Snapshot {new Date(result.snapshotTime).toLocaleString()}
                        </p>
                        <div className="grid gap-4 xl:grid-cols-3">
                            {result.interventions.map((intervention) => (
                                <GroundedRecommendationCard
                                    key={`${intervention.venueId}:${intervention.metricType}`}
                                    recommendation={{
                                        source: "sustainability-advisor",
                                        title: `${METRIC_LABELS[intervention.metricType]} · ${intervention.venueName}`,
                                        action: intervention.action,
                                        rationale: "Generated from the latest sustainability metric snapshot.",
                                        evidence: intervention.evidence,
                                        limitations: intervention.limitations,
                                        urgency: intervention.urgency,
                                        confidence: intervention.confidence,
                                        snapshotAt: result.snapshotTime,
                                        status: "open",
                                        recommendationSource: result.source,
                                        humanReviewRequired: true,
                                        context: { venueId: intervention.venueId, metricType: intervention.metricType },
                                    }}
                                    onAskCopilot={() => window.dispatchEvent(new CustomEvent("pulseops:copilot", { detail: { question: `What should the operator know about ${METRIC_LABELS[intervention.metricType]} sustainability performance right now?`, venueId: intervention.venueId, metricType: intervention.metricType } }))}
                                />
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}

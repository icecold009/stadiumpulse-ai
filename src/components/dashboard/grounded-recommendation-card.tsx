import { BrainCircuit, Check, CircleAlert, Clock3, X } from "lucide-react";
import type { GroundedRecommendation } from "@/lib/ops/recommendations";

type Props = {
    recommendation: GroundedRecommendation;
    onAction?: (action: "accept" | "reject" | "handled") => void;
    onAskCopilot?: () => void;
    pending?: boolean;
};

export default function GroundedRecommendationCard({ recommendation, onAction, onAskCopilot, pending = false }: Props) {
    const isOpenAlert = recommendation.status === "open";

    return (
        <article className="rounded-2xl border border-ai-highlight/35 bg-[linear-gradient(145deg,rgba(139,92,246,0.08),rgba(28,36,45,0.92)_55%)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ai-highlight/30 bg-ai-highlight/10 text-ai-highlight">
                        <BrainCircuit aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ai-highlight">AI suggestion</p>
                        <h3 className="mt-1 font-semibold text-foreground">{recommendation.title}</h3>
                    </div>
                </div>
                <span className="rounded-full border border-ai-highlight/35 bg-ai-highlight/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ai-highlight">
                    {recommendation.urgency}
                </span>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-foreground">{recommendation.action}</p>
            <dl className="mt-4 grid gap-3 border-t border-border/70 pt-4 text-xs leading-5 sm:grid-cols-2">
                <div>
                    <dt className="font-semibold text-text-muted">Evidence</dt>
                    <dd className="text-text-primary">{recommendation.evidence || "No evidence was available."}</dd>
                </div>
                <div>
                    <dt className="font-semibold text-text-muted">Rationale</dt>
                    <dd className="text-text-primary">{recommendation.rationale || "No rationale was recorded."}</dd>
                </div>
                <div>
                    <dt className="font-semibold text-text-muted">Limitations</dt>
                    <dd className="text-text-primary">{recommendation.limitations || "Generated from the available snapshot only."}</dd>
                </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3 w-3" /> Snapshot {new Date(recommendation.snapshotAt).toLocaleString()}</span>
                <span className="rounded-full border border-border px-2 py-0.5">Confidence: {recommendation.confidence}</span>
                <span className="rounded-full border border-border px-2 py-0.5">{recommendation.recommendationSource === "fallback" ? "Safety fallback" : "Model output"}</span>
            </div>

            {onAction && isOpenAlert || onAskCopilot ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                    {onAction && isOpenAlert ? <>
                        <button type="button" onClick={() => onAction("accept")} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-status-ok/35 bg-status-ok/10 px-3 text-xs font-semibold text-status-ok transition hover:bg-status-ok/15 disabled:opacity-50">
                            <Check aria-hidden="true" className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button type="button" onClick={() => onAction("reject")} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-status-warn/35 bg-status-warn/10 px-3 text-xs font-semibold text-status-warn transition hover:bg-status-warn/15 disabled:opacity-50">
                            <X aria-hidden="true" className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button type="button" onClick={() => onAction("handled")} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50">
                            <CircleAlert aria-hidden="true" className="h-3.5 w-3.5" /> Mark handled
                        </button>
                    </> : null}
                    {onAskCopilot ? <button type="button" onClick={onAskCopilot} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ai-highlight/35 bg-ai-highlight/10 px-3 text-xs font-semibold text-ai-highlight transition hover:bg-ai-highlight/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-highlight/60">
                        Ask Copilot
                    </button> : null}
                </div>
            ) : null}
        </article>
    );
}

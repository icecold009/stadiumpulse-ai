import { useEffect, useState } from "react";
import { BrainCircuit, Check, CircleAlert, Clock3, Database, ShieldCheck, X } from "lucide-react";
import type { GroundedRecommendation } from "@/lib/ops/recommendations";

type Props = {
    recommendation: GroundedRecommendation;
    onAction?: (action: "accept" | "reject" | "handled") => void;
    onAskCopilot?: () => void;
    pending?: boolean;
};

export default function GroundedRecommendationCard({ recommendation, onAction, onAskCopilot, pending = false }: Props) {
    const isOpenAlert = recommendation.status === "open";
    const [recommendationAgeMinutes, setRecommendationAgeMinutes] = useState(0);
    useEffect(() => {
        const updateAge = () => setRecommendationAgeMinutes(Math.max(0, Math.floor((Date.now() - Date.parse(recommendation.snapshotAt)) / 60_000)));
        updateAge();
        const timer = window.setInterval(updateAge, 60_000);
        return () => window.clearInterval(timer);
    }, [recommendation.snapshotAt]);
    const isStale = Number.isFinite(recommendationAgeMinutes) && recommendationAgeMinutes >= 15;
    const decisionLabel = recommendation.operatorDecision === "accepted" ? "Accepted" : recommendation.operatorDecision === "rejected" ? "Rejected" : null;

    return (
        <article className="panel border-ai-highlight/45 bg-ai-soft/35 p-4">
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
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="rounded-full border border-ai-highlight/35 bg-ai-highlight/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ai-highlight">
                        {recommendation.urgency}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${isOpenAlert ? "border-status-warn/35 bg-status-warn/10 text-status-warn" : "border-status-ok/35 bg-status-ok/10 text-status-ok"}`}>
                        <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                        {isOpenAlert ? "Human review required" : "Handled"}
                    </span>
                </div>
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
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5"><Database aria-hidden="true" className="h-3 w-3" /> {recommendation.recommendationSource === "fallback" ? "Safety fallback" : "Model output"}</span>
                {isStale ? <span className="rounded-full border border-status-warn/35 bg-status-warn/10 px-2 py-0.5 font-semibold text-status-warn">Stale snapshot · {recommendationAgeMinutes}m old</span> : null}
            </div>

            {decisionLabel ? (
                <p className="mt-3 rounded-xl border border-accent/20 bg-accent/6 px-3 py-2 text-xs text-text-muted">
                    <span className="font-semibold text-foreground">Operator {decisionLabel.toLowerCase()} this recommendation</span>
                    {recommendation.decisionAt ? ` · ${new Date(recommendation.decisionAt).toLocaleString()}` : ""}
                    {recommendation.decisionBy ? " · Recorded by authenticated operator" : ""}
                </p>
            ) : null}

            {onAction && isOpenAlert || onAskCopilot ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                    {onAction && isOpenAlert ? <>
                        <button type="button" onClick={() => onAction("accept")} disabled={pending || recommendation.operatorDecision === "accepted"} className="control button-secondary min-h-9 border-status-ok/35 bg-status-ok/10 px-3 text-xs font-semibold text-status-ok hover:border-status-ok/60 hover:bg-status-ok/15 disabled:opacity-50">
                            <Check aria-hidden="true" className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button type="button" onClick={() => onAction("reject")} disabled={pending || recommendation.operatorDecision === "rejected"} className="control button-secondary min-h-9 border-status-warn/35 bg-status-warn/10 px-3 text-xs font-semibold text-status-warn hover:border-status-warn/60 hover:bg-status-warn/15 disabled:opacity-50">
                            <X aria-hidden="true" className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button type="button" onClick={() => onAction("handled")} disabled={pending} className="control button-secondary min-h-9 border-border bg-surface px-3 text-xs font-semibold text-text-muted hover:border-accent/40 hover:text-accent disabled:opacity-50">
                            <CircleAlert aria-hidden="true" className="h-3.5 w-3.5" /> Mark handled
                        </button>
                    </> : null}
                    {onAskCopilot ? <button type="button" onClick={onAskCopilot} className="control button-ai min-h-9 px-3 text-xs">
                        Ask Copilot
                    </button> : null}
                    {pending ? <span role="status" className="inline-flex items-center text-xs text-text-muted">Saving operator decision…</span> : null}
                </div>
            ) : null}
        </article>
    );
}

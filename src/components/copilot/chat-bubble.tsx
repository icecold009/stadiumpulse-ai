import { AlertTriangle, Bot, Database, LoaderCircle, RefreshCw, UserRound } from "lucide-react";

type ChatBubbleProps = {
    role: "user" | "assistant";
    content: string;
    groundedSummary?: string;
    dataStatus?: "fresh" | "stale" | "missing";
    snapshotAt?: string;
    state?: "ready" | "loading" | "error" | "no-context";
    errorMessage?: string;
    onRetry?: () => void;
};

export default function ChatBubble({
    role,
    content,
    groundedSummary,
    dataStatus,
    snapshotAt,
    state = "ready",
    errorMessage,
    onRetry,
}: ChatBubbleProps) {
    const isAssistant = role === "assistant";
    const statusText = state === "loading"
        ? "Reading the latest authorized snapshot…"
        : state === "no-context"
            ? "No current data is available in this scope."
            : state === "error"
                ? "Generation failed"
                : dataStatus === "stale"
                    ? "Based on a stale snapshot"
                    : dataStatus === "missing"
                        ? "No current evidence"
                        : null;

    return (
        <div className={`flex items-start gap-2.5 ${isAssistant ? "" : "flex-row-reverse"}`}>
            <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${isAssistant
                ? "border-ai-highlight/35 bg-ai-highlight/10 text-ai-highlight"
                : "border-accent/35 bg-accent/10 text-accent"
                }`}>
                {isAssistant ? <Bot aria-hidden="true" className="h-3.5 w-3.5" /> : <UserRound aria-hidden="true" className="h-3.5 w-3.5" />}
            </span>
            <div
                className={`max-w-[88%] rounded-2xl border px-4 py-3 shadow-sm ${isAssistant
                    ? state === "error"
                        ? "rounded-tl-md border-status-critical/35 bg-status-critical/8 text-foreground"
                        : "rounded-tl-md border-border bg-surface text-foreground"
                    : "rounded-tr-md border-accent/25 bg-accent/10 text-foreground"
                    }`}
            >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    {isAssistant ? "PulseOps AI" : "You"}
                </p>

                {isAssistant && statusText ? (
                    <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${state === "error" || dataStatus === "missing" ? "text-status-warn" : "text-ai-highlight"}`}>
                        {state === "loading" ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />}
                        {statusText}
                    </p>
                ) : null}

                <p className="whitespace-pre-wrap text-sm leading-6">
                    {content || (isAssistant ? state === "error" ? errorMessage || "Try the question again." : "Analyzing live data…" : "")}
                </p>

                {isAssistant && state === "error" && onRetry ? (
                    <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-status-critical/35 bg-status-critical/8 px-2.5 text-xs font-semibold text-status-critical transition-colors active:scale-[0.98] hover:bg-status-critical/14 focus-visible:ring-2 focus-visible:ring-status-critical/60">
                        <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> Retry generation
                    </button>
                ) : null}

                {isAssistant && groundedSummary ? (
                    <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-xs leading-5 text-text-muted">
                        <Database aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-highlight" />
                        <span><strong className="font-medium text-foreground">Grounded in:</strong> {groundedSummary}</span>
                    </p>
                ) : null}
                {isAssistant && snapshotAt ? (
                    <p className="mt-2 text-[10px] text-text-muted">Snapshot {new Date(snapshotAt).toLocaleString()}</p>
                ) : null}
            </div>
        </div>
    );
}

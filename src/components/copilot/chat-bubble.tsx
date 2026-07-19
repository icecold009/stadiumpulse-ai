type ChatBubbleProps = {
    role: "user" | "assistant";
    content: string;
    groundedSummary?: string;
};

export default function ChatBubble({
    role,
    content,
    groundedSummary,
}: ChatBubbleProps) {
    const isAssistant = role === "assistant";

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
                    ? "rounded-tl-md border-border bg-surface text-foreground"
                    : "rounded-tr-md border-accent/25 bg-accent/10 text-foreground"
                    }`}
            >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    {isAssistant ? "PulseOps AI" : "You"}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6">
                    {content || (isAssistant ? "Analyzing live data…" : "")}
                </p>

                {isAssistant && groundedSummary ? (
                    <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-xs leading-5 text-text-muted">
                        <Database aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-highlight" />
                        <span><strong className="font-medium text-foreground">Grounded in:</strong> {groundedSummary}</span>
                    </p>
                ) : null}
            </div>
        </div>
    );
}
import { Bot, Database, UserRound } from "lucide-react";

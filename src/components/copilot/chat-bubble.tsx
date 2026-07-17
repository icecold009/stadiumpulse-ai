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
        <div
            className={`rounded-2xl border px-4 py-3 ${isAssistant
                    ? "border-border bg-surface text-foreground"
                    : "ml-auto border-accent/30 bg-accent/10 text-foreground"
                }`}
        >
            <p className="whitespace-pre-wrap text-sm leading-6">
                {content || (isAssistant ? "Thinking..." : "")}
            </p>

            {isAssistant && groundedSummary ? (
                <p className="mt-3 border-t border-border pt-3 text-xs text-text-muted">
                    Grounded in: {groundedSummary}
                </p>
            ) : null}
        </div>
    );
}
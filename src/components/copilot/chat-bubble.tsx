type ChatBubbleProps = {
    role: "user" | "assistant";
    content: string;
    className?: string;
};

export default function ChatBubble({ role, content, className = "" }: ChatBubbleProps) {
    const isUser = role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} ${className}`}>
            <div
                className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${isUser
                        ? "border-accent/40 bg-accent/12 text-text-primary"
                        : "border-ai-highlight/35 bg-surface text-text-primary"
                    }`}
            >
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {isUser ? "You" : "AI copilot"}
                </div>
                <p className="whitespace-pre-wrap">{content}</p>
            </div>
        </div>
    );
}

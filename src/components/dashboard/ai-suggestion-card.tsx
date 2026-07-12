type AiSuggestionCardProps = {
    title: string;
    suggestion: string;
    className?: string;
};

export default function AiSuggestionCard({
    title,
    suggestion,
    className = "",
}: AiSuggestionCardProps) {
    return (
        <article
            className={`rounded-2xl border border-ai-highlight/70 bg-surface-raised p-4 shadow-[0_0_0_1px_rgba(139,92,246,0.12)] ${className}`}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <span className="inline-flex items-center rounded-full border border-ai-highlight/60 bg-ai-highlight/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ai-highlight">
                    AI suggestion
                </span>
            </div>
            <p className="text-sm leading-6 text-text-primary">{suggestion}</p>
        </article>
    );
}

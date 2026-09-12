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
        <article className={`panel relative overflow-hidden border-ai-highlight/45 bg-ai-soft/35 p-5 ${className}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <span className="inline-flex items-center rounded-lg border border-ai-highlight/45 bg-ai-highlight/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-ai-highlight">
                    AI suggestion
                </span>
            </div>
            <p className="text-sm leading-6 text-text-primary">{suggestion}</p>
        </article>
    );
}

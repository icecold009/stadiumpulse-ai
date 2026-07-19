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
            className={`relative overflow-hidden rounded-2xl border border-ai-highlight/45 bg-[linear-gradient(145deg,rgba(139,92,246,0.09),rgba(28,36,45,0.9)_55%)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.14)] ${className}`}
        >
            <div aria-hidden="true" className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-ai-highlight/10 blur-2xl" />
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <span className="inline-flex items-center rounded-full border border-ai-highlight/50 bg-ai-highlight/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-ai-highlight">
                    AI suggestion
                </span>
            </div>
            <p className="text-sm leading-6 text-text-primary">{suggestion}</p>
        </article>
    );
}

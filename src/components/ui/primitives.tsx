import type { HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLElement> & {
    as?: "section" | "article" | "div";
    tone?: "default" | "raised" | "muted" | "ai" | "critical";
};

const panelTone: Record<NonNullable<PanelProps["tone"]>, string> = {
    default: "panel",
    raised: "panel panel-raised",
    muted: "panel bg-surface-muted/55",
    ai: "panel border-ai-highlight/45 bg-ai-soft/35",
    critical: "panel border-status-critical/55 bg-status-critical/8",
};

export function Panel({ as = "section", tone = "default", className = "", ...props }: PanelProps) {
    const Component = as;
    return <Component className={`${panelTone[tone]} ${className}`} {...props} />;
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
                <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-0.04em] text-foreground">{title}</h1>
                {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    );
}

export function SectionHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
                <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.025em] text-foreground">{title}</h2>
                {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-text-muted">{description}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

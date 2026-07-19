type MetricGaugeProps = {
    label: string;
    value: number;
    target: number;
    unit: string;
    className?: string;
};

export default function MetricGauge({
    label,
    value,
    target,
    unit,
    className = "",
}: MetricGaugeProps) {
    const progress = target === 0 ? 0 : Math.min((value / target) * 100, 100);
    const isOnTarget = value <= target;
    const statusClassName = isOnTarget ? "bg-status-ok" : "bg-status-warn";
    const statusText = isOnTarget ? "Within target" : "Above target";

    return (
        <section
            aria-label={`${label} metric gauge`}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(145deg,rgba(28,36,45,0.9),rgba(20,26,33,0.75))] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-accent/25 ${className}`}
        >
            <div aria-hidden="true" className={`absolute left-0 top-0 h-0.5 w-full ${statusClassName} opacity-70`} />
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</h3>
                    <p className="mt-1 text-xs text-text-muted/75">
                        Target {target.toLocaleString()} {unit}
                    </p>
                </div>
                <div className="text-right font-mono text-2xl font-semibold tracking-tight text-foreground">
                    {value.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-text-muted">{unit}</span>
                </div>
            </div>

            <div
                aria-hidden="true"
                className="h-1.5 overflow-hidden rounded-full bg-background/70"
            >
                <div
                    className={`h-full rounded-full transition-[width] duration-300 ${statusClassName}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <i aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${statusClassName}`} />
                    {statusText}
                </span>
                <span className="font-mono">{Math.round(progress)}%</span>
            </div>
        </section>
    );
}

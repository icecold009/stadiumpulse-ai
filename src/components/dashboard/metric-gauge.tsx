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

    return (
        <section
            aria-label={`${label} metric gauge`}
            className={`rounded-2xl border border-border bg-surface p-4 ${className}`}
        >
            <div className="mb-3 flex items-baseline justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-foreground">{label}</h3>
                    <p className="text-xs text-text-muted">
                        Target {target.toLocaleString()} {unit}
                    </p>
                </div>
                <div className="text-right font-mono text-lg font-semibold text-foreground">
                    {value.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-text-muted">{unit}</span>
                </div>
            </div>

            <div
                aria-hidden="true"
                className="h-3 rounded-full bg-surface-raised"
            >
                <div
                    className={`h-full rounded-full transition-[width] duration-300 ${statusClassName}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                <span className="font-medium text-foreground">
                    {isOnTarget ? "Within target" : "Above target"}
                </span>
                <span className="font-mono">{Math.round(progress)}%</span>
            </div>
        </section>
    );
}

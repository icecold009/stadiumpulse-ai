export default function OperatorContextBanner() {
    return (
        <section
            className="mb-5 rounded-2xl border border-accent/35 bg-accent/8 px-4 py-3"
            aria-label="Demo context and decision loop"
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="rounded-full border border-accent/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    Simulated live telemetry
                </span>
                <p className="text-sm text-foreground">
                    Signal → detected risk → grounded AI recommendation → human decision
                </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-text-muted">
                PulseOps uses fictional World Cup 2026 venue data for this demonstration. AI advises; authenticated operators accept, reject, reassign, or mark handled.
            </p>
        </section>
    );
}

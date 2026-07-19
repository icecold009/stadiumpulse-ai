import { Activity, ArrowRight, ShieldCheck } from "lucide-react";

export default function OperatorContextBanner() {
    return (
        <section
            className="mb-5 overflow-hidden rounded-2xl border border-accent/25 bg-[linear-gradient(90deg,rgba(61,214,196,0.09),rgba(20,26,33,0.65))] px-4 py-3"
            aria-label="Demo context and decision loop"
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                    <Activity aria-hidden="true" className="h-3 w-3" /> Simulated live
                </span>
                <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground sm:text-sm">
                    Signal <ArrowRight aria-hidden="true" className="h-3 w-3 text-text-muted" /> Risk <ArrowRight aria-hidden="true" className="h-3 w-3 text-text-muted" /> AI guidance <ArrowRight aria-hidden="true" className="h-3 w-3 text-text-muted" /> Human decision
                </p>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-text-muted">
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                Fictional World Cup 2026 venue data. AI advises; authenticated operators control every outcome.
            </p>
        </section>
    );
}

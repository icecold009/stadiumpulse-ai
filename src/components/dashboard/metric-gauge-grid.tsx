"use client";

import MetricGauge from "@/components/dashboard/metric-gauge";
import { Panel } from "@/components/ui/primitives";

type MetricGaugeItem = {
    label: string;
    value: number;
    target: number;
    unit: string;
    lowerIsBetter?: boolean;
    observedAt?: string | null;
    nextAction?: string;
};

type MetricGaugeGridProps = {
    metrics: MetricGaugeItem[];
};

export default function MetricGaugeGrid({ metrics }: MetricGaugeGridProps) {
    if (!metrics.length) {
        return <Panel tone="muted" className="w-full"><p className="text-sm text-muted-foreground">No metrics available.</p></Panel>;
    }

    return (
        <section className="w-full">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((metric, index) => (
                    <MetricGauge
                        key={`${metric.label}-${index}`}
                        label={metric.label}
                        value={metric.value}
                        target={metric.target}
                        unit={metric.unit}
                        lowerIsBetter={metric.lowerIsBetter}
                        observedAt={metric.observedAt}
                        nextAction={metric.nextAction}
                        className="h-full"
                    />
                ))}
            </div>
        </section>
    );
}

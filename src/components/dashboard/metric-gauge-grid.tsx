"use client";

import MetricGauge from "@/components/dashboard/metric-gauge";

type MetricGaugeItem = {
    label: string;
    value: number;
    target: number;
    unit: string;
};

type MetricGaugeGridProps = {
    metrics: MetricGaugeItem[];
};

export default function MetricGaugeGrid({ metrics }: MetricGaugeGridProps) {
    if (!metrics.length) {
        return (
            <section className="w-full">
                <p className="text-sm text-muted-foreground">No metrics available.</p>
            </section>
        );
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
                        className="h-full"
                    />
                ))}
            </div>
        </section>
    );
}
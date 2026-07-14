"use client";

import { useMemo } from "react";
import type { Database } from "@/types/database";
import MetricGaugeGrid from "@/components/dashboard/metric-gauge-grid";
import { useRealtimeZoneTelemetry } from "@/hooks/use-realtime-zone-telemetry";
import { useRealtimeAlerts } from "@/hooks/use-realtime-alerts";
import { useRealtimeVolunteers } from "@/hooks/use-realtime-volunteers";
import { getTotalOccupancyPct } from "@/components/dashboard/lib/telemetry-utils";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];

type SustainabilityMetric = {
    metric_type: "energy_kwh" | "water_l" | "waste_diverted_pct";
    value: number;
    target: number;
};

type Props = {
    initialZones: ZoneRow[];
    initialTelemetry: ZoneTelemetryRow[];
    initialAlerts?: AlertRow[];
    initialVolunteers?: VolunteerRow[];
    mode: "ops" | "overview" | "sustainability" | "volunteers";
    sustainabilityMetrics?: SustainabilityMetric[];
};

function OpsMetrics({
    initialZones,
    initialTelemetry,
    initialAlerts = [],
}: Pick<Props, "initialZones" | "initialTelemetry" | "initialAlerts">) {
    const telemetry = useRealtimeZoneTelemetry(initialTelemetry);
    const alerts = useRealtimeAlerts(initialAlerts);

    const metrics = useMemo(() => {
        const totalOccupancyPct = getTotalOccupancyPct(initialZones, telemetry);
        const openAlerts = alerts.filter((a) => a.status === "open").length;

        return [
            { label: "Total Occupancy", value: Number(totalOccupancyPct.toFixed(1)), target: 100, unit: "%" },
            { label: "Open Alerts", value: openAlerts, target: Math.max(openAlerts, 1), unit: "" },
        ];
    }, [initialZones, telemetry, alerts]);

    return <MetricGaugeGrid metrics={metrics} />;
}

function OverviewMetrics({
    initialZones,
    initialTelemetry,
    initialAlerts,
}: Pick<Props, "initialZones" | "initialTelemetry" | "initialAlerts">) {
    const telemetry = useRealtimeZoneTelemetry(initialTelemetry);
    const alerts = useRealtimeAlerts(initialAlerts ?? []);

    const metrics = useMemo(() => {
        const totalOccupancyPct = getTotalOccupancyPct(initialZones, telemetry);
        const base = [
            { label: "Total Occupancy", value: Number(totalOccupancyPct.toFixed(1)), target: 100, unit: "%" },
        ];
        if (initialAlerts) {
            base.push({
                label: "Open Alerts",
                value: alerts.filter((a) => a.status === "open").length,
                target: Math.max(alerts.length, 1),
                unit: "",
            });
        }
        return base;
    }, [initialZones, telemetry, alerts, initialAlerts]);

    return <MetricGaugeGrid metrics={metrics} />;
}

function SustainabilityMetrics({
    sustainabilityMetrics = [],
}: Pick<Props, "sustainabilityMetrics">) {
    const metrics = sustainabilityMetrics.map((m) => ({
        label: m.metric_type,
        value: m.value,
        target: m.target,
        unit: m.metric_type === "energy_kwh" ? "kWh" : m.metric_type === "water_l" ? "L" : "%",
    }));

    return <MetricGaugeGrid metrics={metrics} />;
}

function VolunteerMetrics({
    initialVolunteers = [],
}: Pick<Props, "initialVolunteers">) {
    const volunteers = useRealtimeVolunteers(initialVolunteers);

    const metrics = useMemo(() => {
        const assigned = volunteers.filter((v) => v.status === "assigned").length;
        const available = volunteers.filter((v) => v.status === "available").length;
        const total = volunteers.length;

        return [
            { label: "Assigned Volunteers", value: assigned, target: Math.max(total, 1), unit: "" },
            { label: "Available Volunteers", value: available, target: Math.max(total, 1), unit: "" },
        ];
    }, [volunteers]);

    return <MetricGaugeGrid metrics={metrics} />;
}

export default function LiveMetricGaugeGrid(props: Props) {
    if (props.mode === "ops") {
        return (
            <OpsMetrics
                initialZones={props.initialZones}
                initialTelemetry={props.initialTelemetry}
                initialAlerts={props.initialAlerts}
            />
        );
    }

    if (props.mode === "overview") {
        return (
            <OverviewMetrics
                initialZones={props.initialZones}
                initialTelemetry={props.initialTelemetry}
                initialAlerts={props.initialAlerts}
            />
        );
    }

    if (props.mode === "sustainability") {
        return <SustainabilityMetrics sustainabilityMetrics={props.sustainabilityMetrics} />;
    }

    return <VolunteerMetrics initialVolunteers={props.initialVolunteers} />;
}
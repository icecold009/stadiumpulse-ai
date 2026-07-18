import type { Role } from "@/lib/auth/roles";
import type { DataSlice } from "@/lib/ai/copilot-prompt";

export type RawTelemetry = {
    zone_id: string;
    occupancy: number;
    recorded_at: string;
};

export type RawZone = {
    id: string;
    label: string;
    capacity: number;
    venues: { name: string } | null;
};

export type RawAlert = {
    id: string;
    severity: "warn" | "critical";
    message: string;
    ai_recommendation: string | null;
    status: "open" | "handled";
    created_at: string;
    zones: { label: string; venues: { name: string } | null } | null;
    venues: { name: string } | null;
};

export type RawSustainabilityMetric = {
    metric_type: string;
    value: number;
    target: number;
    recorded_at: string;
    venues: { name: string } | null;
};

export type RawVolunteer = {
    name: string;
    status: string;
    venues: { name: string } | null;
    zones: { label: string } | null;
};

export type RawVenueAccess = {
    venue_id: string;
    venues: { name: string } | null;
};

type CopilotContextInput = {
    role: Role;
    venueIds: string[];
    venueNames: string[];
    zones: RawZone[];
    telemetryRows: RawTelemetry[];
    alertRows: RawAlert[];
    sustainabilityRows: RawSustainabilityMetric[];
    volunteerRows: RawVolunteer[];
    windowMinutes: number;
    fetchedAt?: string;
};

export function buildCopilotContext(input: CopilotContextInput): {
    slice: DataSlice;
    groundedSummary: string;
} {
    const zonesById = new Map(input.zones.map((zone) => [zone.id, zone]));
    const telemetry = input.telemetryRows.map((row) => ({
        zone_id: row.zone_id,
        zone_label: zonesById.get(row.zone_id)?.label ?? "Unknown zone",
        venue_name: zonesById.get(row.zone_id)?.venues?.name ?? "Unknown venue",
        occupancy: row.occupancy,
        zone_capacity: zonesById.get(row.zone_id)?.capacity ?? 0,
        recorded_at: row.recorded_at,
    }));
    const alerts = input.alertRows.map((row) => ({
        id: row.id,
        zone_label: row.zones?.label ?? "Venue-wide",
        venue_name: row.zones?.venues?.name ?? row.venues?.name ?? "Unknown venue",
        severity: row.severity,
        message: row.message,
        ai_recommendation: row.ai_recommendation ?? "",
        created_at: row.created_at,
    }));
    const sustainability = input.sustainabilityRows.map((row) => ({
        venue_name: row.venues?.name ?? "Unknown venue",
        metric_type: row.metric_type,
        value: row.value,
        target: row.target,
        recorded_at: row.recorded_at,
    }));
    const volunteers = input.volunteerRows.map((row) => ({
        venue_name: row.venues?.name ?? "Unknown venue",
        zone_label: row.zones?.label ?? "Unassigned",
        name: row.name,
        status: row.status,
    }));

    return {
        slice: {
            requesterRole: input.role,
            venueNames: input.venueNames,
            telemetry,
            alerts,
            sustainability,
            volunteers,
            windowMinutes: input.windowMinutes,
            fetchedAt: input.fetchedAt ?? new Date().toISOString(),
        },
        groundedSummary: [
            `${input.venueIds.length} authorized venues`,
            `${telemetry.length} telemetry rows`,
            `${alerts.length} open alerts`,
            `${sustainability.length} sustainability rows`,
            `${volunteers.length} volunteer rows`,
            `window ${input.windowMinutes} min`,
        ].join(" | "),
    };
}

export type UserRole =
    | "admin"
    | "ops_manager"
    | "sustainability_lead"
    | "volunteer_coordinator";

export type SustainabilityMetricType =
    | "energy_kwh"
    | "water_l"
    | "waste_diverted_pct";

export type AlertSeverity = "warn" | "critical";

export type AlertStatus = "open" | "handled";

export type VolunteerStatus = "assigned" | "available";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface VenueRow {
    id: string;
    name: string;
    city: string;
    capacity: number;
    created_at: string;
}

export interface VenueInsert {
    id?: string;
    name: string;
    city: string;
    capacity: number;
    created_at?: string;
}

export interface VenueUpdate {
    id?: string;
    name?: string;
    city?: string;
    capacity?: number;
    created_at?: string;
}

export interface ZoneRow {
    id: string;
    venue_id: string;
    label: string;
    capacity: number;
}

export interface ZoneInsert {
    id?: string;
    venue_id: string;
    label: string;
    capacity: number;
}

export interface ZoneUpdate {
    id?: string;
    venue_id?: string;
    label?: string;
    capacity?: number;
}

export interface ZoneTelemetryRow {
    id: number;
    zone_id: string;
    occupancy: number;
    recorded_at: string;
}

export interface ZoneTelemetryInsert {
    id?: never;
    zone_id: string;
    occupancy: number;
    recorded_at?: string;
}

export interface ZoneTelemetryUpdate {
    id?: never;
    zone_id?: string;
    occupancy?: number;
    recorded_at?: string;
}

export interface GateRow {
    id: string;
    venue_id: string;
    label: string;
}

export interface GateInsert {
    id?: string;
    venue_id: string;
    label: string;
}

export interface GateUpdate {
    id?: string;
    venue_id?: string;
    label?: string;
}

export interface GateScanRow {
    id: number;
    gate_id: string;
    scan_count: number;
    recorded_at: string;
}

export interface GateScanInsert {
    id?: never;
    gate_id: string;
    scan_count: number;
    recorded_at?: string;
}

export interface GateScanUpdate {
    id?: never;
    gate_id?: string;
    scan_count?: number;
    recorded_at?: string;
}

export interface SustainabilityMetricRow {
    id: number;
    venue_id: string;
    metric_type: SustainabilityMetricType;
    value: number;
    target: number;
    recorded_at: string;
}

export interface SustainabilityMetricInsert {
    id?: never;
    venue_id: string;
    metric_type: SustainabilityMetricType;
    value: number;
    target: number;
    recorded_at?: string;
}

export interface SustainabilityMetricUpdate {
    id?: never;
    venue_id?: string;
    metric_type?: SustainabilityMetricType;
    value?: number;
    target?: number;
    recorded_at?: string;
}

export interface AlertRow {
    id: string;
    venue_id: string;
    zone_id: string | null;
    severity: AlertSeverity;
    message: string;
    ai_recommendation: string;
    status: AlertStatus;
    created_at: string;
    handled_by: string | null;
    handled_at: string | null;
}

export interface AlertInsert {
    id?: string;
    venue_id: string;
    zone_id?: string | null;
    severity: AlertSeverity;
    message: string;
    ai_recommendation: string;
    status?: AlertStatus;
    created_at?: string;
    handled_by?: string | null;
    handled_at?: string | null;
}

export interface AlertUpdate {
    id?: string;
    venue_id?: string;
    zone_id?: string | null;
    severity?: AlertSeverity;
    message?: string;
    ai_recommendation?: string;
    status?: AlertStatus;
    created_at?: string;
    handled_by?: string | null;
    handled_at?: string | null;
}

export interface VolunteerRow {
    id: string;
    venue_id: string;
    zone_id: string | null;
    name: string;
    status: VolunteerStatus;
}

export interface VolunteerInsert {
    id?: string;
    venue_id: string;
    zone_id?: string | null;
    name: string;
    status: VolunteerStatus;
}

export interface VolunteerUpdate {
    id?: string;
    venue_id?: string;
    zone_id?: string | null;
    name?: string;
    status?: VolunteerStatus;
}

export interface CopilotQueryRow {
    id: string;
    user_id: string;
    question: string;
    grounded_data_summary: string;
    answer: string;
    created_at: string;
}

export interface CopilotQueryInsert {
    id?: string;
    user_id: string;
    question: string;
    grounded_data_summary: string;
    answer: string;
    created_at?: string;
}

export interface CopilotQueryUpdate {
    id?: string;
    user_id?: string;
    question?: string;
    grounded_data_summary?: string;
    answer?: string;
    created_at?: string;
}

export interface Database {
    public: {
        Tables: {
            venues: {
                Row: VenueRow;
                Insert: VenueInsert;
                Update: VenueUpdate;
            };
            zones: {
                Row: ZoneRow;
                Insert: ZoneInsert;
                Update: ZoneUpdate;
            };
            zone_telemetry: {
                Row: ZoneTelemetryRow;
                Insert: ZoneTelemetryInsert;
                Update: ZoneTelemetryUpdate;
            };
            gates: {
                Row: GateRow;
                Insert: GateInsert;
                Update: GateUpdate;
            };
            gate_scans: {
                Row: GateScanRow;
                Insert: GateScanInsert;
                Update: GateScanUpdate;
            };
            sustainability_metrics: {
                Row: SustainabilityMetricRow;
                Insert: SustainabilityMetricInsert;
                Update: SustainabilityMetricUpdate;
            };
            alerts: {
                Row: AlertRow;
                Insert: AlertInsert;
                Update: AlertUpdate;
            };
            volunteers: {
                Row: VolunteerRow;
                Insert: VolunteerInsert;
                Update: VolunteerUpdate;
            };
            copilot_queries: {
                Row: CopilotQueryRow;
                Insert: CopilotQueryInsert;
                Update: CopilotQueryUpdate;
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

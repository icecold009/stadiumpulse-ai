export type FreshnessState = "fresh" | "stale" | "missing";

export type DataFreshness = {
    state: FreshnessState;
    observedAt: string | null;
    ageSeconds: number | null;
};

export type ZoneRiskStatus = "normal" | "watch" | "critical";
export type TrendDirection = "rising" | "steady" | "falling";

export type ZoneRisk = {
    id: string;
    venueId: string;
    label: string;
    capacity: number;
    occupancy: number | null;
    occupancyPercent: number | null;
    status: ZoneRiskStatus;
    trend: TrendDirection;
    freshness: DataFreshness;
    recordedAt: string | null;
    openAlertCount: number;
};

export type GateMetric = {
    id: string;
    venueId: string;
    label: string;
    currentScans: number | null;
    previousScans: number | null;
    changePercent: number | null;
    trend: TrendDirection;
    freshness: DataFreshness;
    recordedAt: string | null;
};

export type AlertSummary = {
    id: string;
    venueId: string;
    zoneId: string | null;
    zoneLabel: string | null;
    severity: "warn" | "critical";
    message: string;
    aiRecommendation: string;
    aiEvidence: string;
    aiLimitations: string;
    aiUrgency: "monitor" | "prompt" | "immediate";
    aiConfidence: "low" | "medium" | "high";
    recommendationSource: "ai" | "fallback";
    snapshotAt: string;
    operatorDecision: "accepted" | "rejected" | null;
    decisionAt: string | null;
    status: "open" | "handled";
    createdAt: string;
};

export type DecisionEvent = {
    alertId: string;
    venueId: string;
    zoneLabel: string | null;
    decision: "accepted" | "rejected";
    decidedAt: string;
};

export type OpsSnapshot = {
    fetchedAt: string;
    selectedVenueId: string | null;
    zones: ZoneRisk[];
    gates: GateMetric[];
    alerts: AlertSummary[];
    decisionTimeline: DecisionEvent[];
    freshness: DataFreshness;
    simulationLabel: "simulated";
};

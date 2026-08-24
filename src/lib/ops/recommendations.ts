import type { AlertSummary } from "@/lib/ops/types";

export type GroundedRecommendation = {
    source: "alert" | "resource-advisor" | "sustainability-advisor" | "copilot";
    title: string;
    action: string;
    rationale: string;
    evidence: string;
    limitations: string;
    urgency: "monitor" | "prompt" | "immediate";
    confidence: "low" | "medium" | "high";
    snapshotAt: string;
    status: "open" | "handled";
    recommendationSource: "ai" | "fallback";
    humanReviewRequired: true;
    operatorDecision?: "accepted" | "rejected" | null;
    decisionAt?: string | null;
    decisionBy?: string | null;
    handledAt?: string | null;
    handledBy?: string | null;
    context?: {
        venueId?: string;
        zoneId?: string;
        gateId?: string;
        alertId?: string;
        metricType?: "energy_kwh" | "water_l" | "waste_diverted_pct";
    };
};

export function recommendationFromAlert(alert: AlertSummary): GroundedRecommendation {
    return {
        source: "alert",
        title: alert.zoneLabel ? `${alert.zoneLabel} · ${alert.severity} alert` : `${alert.severity} venue alert`,
        action: alert.aiRecommendation || alert.message,
        rationale: alert.message,
        evidence: alert.aiEvidence,
        limitations: alert.aiLimitations,
        urgency: alert.aiUrgency,
        confidence: alert.aiConfidence,
        snapshotAt: alert.snapshotAt,
        status: alert.status,
        recommendationSource: alert.recommendationSource,
        humanReviewRequired: true,
        operatorDecision: alert.operatorDecision,
        decisionAt: alert.decisionAt,
        decisionBy: alert.decisionBy,
        handledAt: alert.handledAt,
        handledBy: alert.handledBy,
        context: {
            venueId: alert.venueId,
            zoneId: alert.zoneId ?? undefined,
            alertId: alert.id,
        },
    };
}

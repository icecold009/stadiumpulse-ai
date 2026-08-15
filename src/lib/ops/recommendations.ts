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
        context: {
            venueId: alert.venueId,
            zoneId: alert.zoneId ?? undefined,
            alertId: alert.id,
        },
    };
}

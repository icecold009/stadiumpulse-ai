export const ALERT_URGENCIES = ["monitor", "prompt", "immediate"] as const;
export const ALERT_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

export type AlertUrgency = (typeof ALERT_URGENCIES)[number];
export type AlertConfidence = (typeof ALERT_CONFIDENCE_LEVELS)[number];

export type AlertRecommendation = {
    action: string;
    urgency: AlertUrgency;
    evidence: string;
    limitations: string;
    confidence: AlertConfidence;
    snapshotTime: string;
};

export const ALERT_RECOMMENDATION_OUTPUT_CONFIG = {
    format: {
        type: "json_schema",
        schema: {
            type: "object",
            properties: {
                action: { type: "string" },
                urgency: { type: "string", enum: ALERT_URGENCIES },
                evidence: { type: "string" },
                limitations: { type: "string" },
                confidence: { type: "string", enum: ALERT_CONFIDENCE_LEVELS },
                snapshotTime: { type: "string" },
            },
            required: [
                "action",
                "urgency",
                "evidence",
                "limitations",
                "confidence",
                "snapshotTime",
            ],
            additionalProperties: false,
        },
    },
} as const;

type AlertRecommendationContext = {
    zoneLabel: string;
    occupancy: number;
    capacity: number;
    severity: "warn" | "critical";
    snapshotTime: string;
};

export function fallbackAlertRecommendation(
    context: AlertRecommendationContext
): AlertRecommendation {
    const percent = Math.round((context.occupancy / context.capacity) * 100);
    return {
        action:
            context.severity === "critical"
                ? `Pause inflow to ${context.zoneLabel} and send crowd-control staff to the nearest entry points.`
                : `Position crowd-control staff near ${context.zoneLabel} and prepare to redirect inflow.`,
        urgency: context.severity === "critical" ? "immediate" : "prompt",
        evidence: `${context.zoneLabel} occupancy is ${context.occupancy}/${context.capacity} (${percent}%).`,
        limitations: "Deterministic safety fallback: AI output was unavailable or invalid. Based only on the latest simulated occupancy snapshot; staff availability and adjacent-zone conditions were not provided.",
        confidence: "medium",
        snapshotTime: context.snapshotTime,
    };
}

export function buildAlertRecommendationPrompt(
    context: AlertRecommendationContext
): string {
    return `DATA:\n${JSON.stringify({
        zone: context.zoneLabel,
        occupancy: context.occupancy,
        capacity: context.capacity,
        occupancy_percent: Math.round((context.occupancy / context.capacity) * 100),
        severity: context.severity,
        snapshot_time: context.snapshotTime,
    })}\n\nReturn one JSON object with exactly these keys: action, urgency, evidence, limitations, confidence, snapshotTime. urgency must be monitor, prompt, or immediate. confidence must be low, medium, or high. Use only DATA facts and never claim the action was executed.`;
}

function isOneOf<T extends readonly string[]>(
    value: unknown,
    allowed: T
): value is T[number] {
    return typeof value === "string" && allowed.includes(value);
}

export function parseAlertRecommendation(
    raw: string,
    fallback: AlertRecommendation
): AlertRecommendation {
    const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    const candidate =
        objectStart >= 0 && objectEnd > objectStart
            ? cleaned.slice(objectStart, objectEnd + 1)
            : cleaned;

    try {
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        const urgency =
            typeof parsed.urgency === "string" ? parsed.urgency.toLowerCase() : parsed.urgency;
        const confidence =
            typeof parsed.confidence === "string"
                ? parsed.confidence.toLowerCase()
                : parsed.confidence;
        const snapshotTime = parsed.snapshotTime ?? parsed.snapshot_time;

        if (
            typeof parsed.action !== "string" ||
            typeof parsed.evidence !== "string" ||
            typeof parsed.limitations !== "string" ||
            typeof snapshotTime !== "string" ||
            !isOneOf(urgency, ALERT_URGENCIES) ||
            !isOneOf(confidence, ALERT_CONFIDENCE_LEVELS)
        ) {
            return fallback;
        }

        return {
            action: parsed.action.slice(0, 500),
            urgency,
            evidence: parsed.evidence.slice(0, 500),
            limitations: parsed.limitations.slice(0, 500),
            confidence,
            snapshotTime,
        };
    } catch {
        return fallback;
    }
}

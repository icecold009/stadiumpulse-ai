import {
    ADVISOR_CONFIDENCE_LEVELS,
    ADVISOR_URGENCIES,
    type AdvisorConfidence,
    type AdvisorUrgency,
} from "@/lib/ai/resource-advisor";

export type SustainabilitySnapshot = {
    venueId: string;
    venueName: string;
    metricType: "energy_kwh" | "water_l" | "waste_diverted_pct";
    value: number;
    target: number;
    recordedAt: string;
};

export type SustainabilityIntervention = {
    venueId: string;
    venueName: string;
    metricType: SustainabilitySnapshot["metricType"];
    action: string;
    evidence: string;
    limitations: string;
    urgency: AdvisorUrgency;
    confidence: AdvisorConfidence;
};

export type SustainabilityAdvisorResult = {
    source: "ai" | "fallback";
    snapshotTime: string;
    interventions: SustainabilityIntervention[];
};

export const SUSTAINABILITY_ADVISOR_OUTPUT_CONFIG = {
    format: {
        type: "json_schema",
        schema: {
            type: "object",
            properties: {
                snapshotTime: { type: "string" },
                interventions: {
                    type: "array",
                    maxItems: 3,
                    items: {
                        type: "object",
                        properties: {
                            venueId: { type: "string" },
                            venueName: { type: "string" },
                            metricType: {
                                type: "string",
                                enum: ["energy_kwh", "water_l", "waste_diverted_pct"],
                            },
                            action: { type: "string" },
                            evidence: { type: "string" },
                            limitations: { type: "string" },
                            urgency: { type: "string", enum: ADVISOR_URGENCIES },
                            confidence: {
                                type: "string",
                                enum: ADVISOR_CONFIDENCE_LEVELS,
                            },
                        },
                        required: [
                            "venueId",
                            "venueName",
                            "metricType",
                            "action",
                            "evidence",
                            "limitations",
                            "urgency",
                            "confidence",
                        ],
                        additionalProperties: false,
                    },
                },
            },
            required: ["snapshotTime", "interventions"],
            additionalProperties: false,
        },
    },
} as const;

function pressure(snapshot: SustainabilitySnapshot): number {
    if (snapshot.target <= 0) return 0;
    return snapshot.metricType === "waste_diverted_pct"
        ? Math.max(0, (snapshot.target - snapshot.value) / snapshot.target)
        : Math.max(0, (snapshot.value - snapshot.target) / snapshot.target);
}

export function fallbackSustainabilityAdvisor(
    snapshots: SustainabilitySnapshot[]
): SustainabilityAdvisorResult {
    const ordered = [...snapshots].sort((a, b) => pressure(b) - pressure(a));
    const offTarget = ordered.filter((snapshot) => pressure(snapshot) > 0);
    const selected = (offTarget.length > 0 ? offTarget : ordered.slice(0, 1)).slice(0, 3);
    const snapshotTime =
        selected.map((snapshot) => snapshot.recordedAt).sort().at(-1) ??
        new Date().toISOString();

    return {
        source: "fallback",
        snapshotTime,
        interventions: selected.map((snapshot) => {
            const gap = pressure(snapshot);
            const urgency: AdvisorUrgency =
                gap >= 0.2 ? "immediate" : gap >= 0.08 ? "prompt" : "monitor";
            const action =
                snapshot.metricType === "energy_kwh"
                    ? "Review non-essential concourse lighting and equipment loads before the next operating interval."
                    : snapshot.metricType === "water_l"
                      ? "Inspect high-use washroom and concessions zones for avoidable flow or leaks."
                      : "Send a waste-sorting reminder to concessions and verify bin-pair coverage at high-traffic zones.";
            return {
                venueId: snapshot.venueId,
                venueName: snapshot.venueName,
                metricType: snapshot.metricType,
                action,
                evidence: `${snapshot.metricType} is ${snapshot.value} against a target of ${snapshot.target} at ${snapshot.recordedAt}.`,
                limitations:
                    "Deterministic fallback based only on the latest simulated venue metric; equipment-, vendor-, and zone-level causes were not supplied.",
                urgency,
                confidence: "medium",
            };
        }),
    };
}

export function buildSustainabilityAdvisorPrompt(
    snapshots: SustainabilitySnapshot[]
): string {
    return `DATA:\n${JSON.stringify(
        snapshots.map((snapshot) => ({
            venue_id: snapshot.venueId,
            venue_name: snapshot.venueName,
            metric_type: snapshot.metricType,
            value: snapshot.value,
            target: snapshot.target,
            recorded_at: snapshot.recordedAt,
        }))
    )}\n\nRecommend up to three bounded interventions for the greatest target gaps. For energy and water, lower than target is favorable; for waste_diverted_pct, higher than target is favorable. Use DATA only. Never invent a cause, savings amount, or action already taken.`;
}

export function parseSustainabilityAdvisor(
    raw: string,
    snapshots: SustainabilitySnapshot[],
    fallback: SustainabilityAdvisorResult
): SustainabilityAdvisorResult {
    try {
        const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
        if (!Array.isArray(parsed.interventions)) return fallback;
        const validKeys = new Map(
            snapshots.map((snapshot) => [
                `${snapshot.venueId}:${snapshot.metricType}`,
                snapshot,
            ])
        );
        const interventions: SustainabilityIntervention[] = [];

        for (const candidate of parsed.interventions.slice(0, 3)) {
            if (!candidate || typeof candidate !== "object") return fallback;
            const item = candidate as Record<string, unknown>;
            const key = `${String(item.venueId)}:${String(item.metricType)}`;
            const snapshot = validKeys.get(key);
            if (
                !snapshot ||
                typeof item.action !== "string" ||
                typeof item.evidence !== "string" ||
                typeof item.limitations !== "string" ||
                !ADVISOR_URGENCIES.includes(item.urgency as AdvisorUrgency) ||
                !ADVISOR_CONFIDENCE_LEVELS.includes(item.confidence as AdvisorConfidence)
            ) {
                return fallback;
            }
            interventions.push({
                venueId: snapshot.venueId,
                venueName: snapshot.venueName,
                metricType: snapshot.metricType,
                action: item.action.trim().slice(0, 500),
                evidence: item.evidence.trim().slice(0, 500),
                limitations: item.limitations.trim().slice(0, 500),
                urgency: item.urgency as AdvisorUrgency,
                confidence: item.confidence as AdvisorConfidence,
            });
        }

        if (interventions.length === 0) return fallback;
        return {
            source: "ai",
            snapshotTime:
                typeof parsed.snapshotTime === "string"
                    ? parsed.snapshotTime.slice(0, 100)
                    : fallback.snapshotTime,
            interventions,
        };
    } catch {
        return fallback;
    }
}

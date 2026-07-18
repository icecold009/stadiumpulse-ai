export const ADVISOR_URGENCIES = ["monitor", "prompt", "immediate"] as const;
export const ADVISOR_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

export type AdvisorUrgency = (typeof ADVISOR_URGENCIES)[number];
export type AdvisorConfidence = (typeof ADVISOR_CONFIDENCE_LEVELS)[number];

export type AdvisorZoneInput = {
    zoneId: string;
    zoneLabel: string;
    venueName: string;
    capacity: number;
    currentOccupancy: number;
    currentRecordedAt: string;
    previousOccupancy?: number;
    previousRecordedAt?: string;
    availableVolunteers: number;
};

export type AdvisorZoneSnapshot = AdvisorZoneInput & {
    currentPercent: number;
    predictedOccupancy: number;
    predictedPercent: number;
    trend: "rising" | "steady" | "falling";
};

export type ResourceRecommendation = {
    zoneId: string;
    zoneLabel: string;
    venueName: string;
    action: string;
    rationale: string;
    evidence: string;
    limitations: string;
    urgency: AdvisorUrgency;
    confidence: AdvisorConfidence;
};

export type ResourceAdvisorResult = {
    source: "ai" | "fallback";
    horizonMinutes: number;
    snapshotTime: string;
    recommendations: ResourceRecommendation[];
};

export const RESOURCE_ADVISOR_OUTPUT_CONFIG = {
    format: {
        type: "json_schema",
        schema: {
            type: "object",
            properties: {
                snapshotTime: { type: "string" },
                recommendations: {
                    type: "array",
                    maxItems: 3,
                    items: {
                        type: "object",
                        properties: {
                            zoneId: { type: "string" },
                            zoneLabel: { type: "string" },
                            venueName: { type: "string" },
                            action: { type: "string" },
                            rationale: { type: "string" },
                            evidence: { type: "string" },
                            limitations: { type: "string" },
                            urgency: { type: "string", enum: ADVISOR_URGENCIES },
                            confidence: {
                                type: "string",
                                enum: ADVISOR_CONFIDENCE_LEVELS,
                            },
                        },
                        required: [
                            "zoneId",
                            "zoneLabel",
                            "venueName",
                            "action",
                            "rationale",
                            "evidence",
                            "limitations",
                            "urgency",
                            "confidence",
                        ],
                        additionalProperties: false,
                    },
                },
            },
            required: ["snapshotTime", "recommendations"],
            additionalProperties: false,
        },
    },
} as const;

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value));
}

export function prepareAdvisorZones(
    zones: AdvisorZoneInput[],
    horizonMinutes = 15
): AdvisorZoneSnapshot[] {
    return zones
        .filter((zone) => zone.capacity > 0)
        .map((zone) => {
            let projectedChange = 0;
            if (
                zone.previousOccupancy !== undefined &&
                zone.previousRecordedAt
            ) {
                const elapsedMinutes =
                    (Date.parse(zone.currentRecordedAt) -
                        Date.parse(zone.previousRecordedAt)) /
                    60_000;
                if (Number.isFinite(elapsedMinutes) && elapsedMinutes >= 0.5) {
                    const changePerMinute =
                        (zone.currentOccupancy - zone.previousOccupancy) /
                        elapsedMinutes;
                    projectedChange = changePerMinute * horizonMinutes;
                }
            }

            const predictedOccupancy = Math.round(
                clamp(zone.currentOccupancy + projectedChange, 0, zone.capacity)
            );
            const difference = predictedOccupancy - zone.currentOccupancy;
            const trend: AdvisorZoneSnapshot["trend"] =
                difference > zone.capacity * 0.01
                    ? "rising"
                    : difference < -zone.capacity * 0.01
                      ? "falling"
                      : "steady";

            return {
                ...zone,
                currentPercent: (zone.currentOccupancy / zone.capacity) * 100,
                predictedOccupancy,
                predictedPercent: (predictedOccupancy / zone.capacity) * 100,
                trend,
            };
        })
        .sort((a, b) => b.predictedPercent - a.predictedPercent);
}

export function fallbackResourceAdvisor(
    zones: AdvisorZoneSnapshot[],
    horizonMinutes = 15
): ResourceAdvisorResult {
    const candidates = zones.filter((zone) => zone.predictedPercent >= 70);
    const selected = (candidates.length > 0 ? candidates : zones.slice(0, 1)).slice(0, 3);
    const snapshotTime =
        selected.map((zone) => zone.currentRecordedAt).sort().at(-1) ??
        new Date().toISOString();

    return {
        source: "fallback",
        horizonMinutes,
        snapshotTime,
        recommendations: selected.map((zone) => {
            const urgency: AdvisorUrgency =
                zone.predictedPercent >= 90
                    ? "immediate"
                    : zone.predictedPercent >= 80
                      ? "prompt"
                      : "monitor";
            return {
                zoneId: zone.zoneId,
                zoneLabel: zone.zoneLabel,
                venueName: zone.venueName,
                action:
                    urgency === "immediate"
                        ? `Stage trained crowd-control staff at ${zone.zoneLabel} and prepare to redirect inflow.`
                        : `Review available staffing near ${zone.zoneLabel} and keep a redeployment team ready.`,
                rationale: `${zone.zoneLabel} has the highest projected occupancy pressure in the available snapshot.`,
                evidence: `${zone.currentOccupancy}/${zone.capacity} now (${Math.round(zone.currentPercent)}%); projected ${zone.predictedOccupancy}/${zone.capacity} (${Math.round(zone.predictedPercent)}%) in ${horizonMinutes} minutes.`,
                limitations: `Deterministic safety fallback. Exact security and medical staffing levels were not supplied; ${zone.availableVolunteers} volunteers are currently marked available at this venue.`,
                urgency,
                confidence: zone.previousOccupancy === undefined ? "low" : "medium",
            };
        }),
    };
}

export function buildResourceAdvisorPrompt(
    zones: AdvisorZoneSnapshot[],
    horizonMinutes = 15
): string {
    return `DATA:\n${JSON.stringify({
        horizon_minutes: horizonMinutes,
        zones: zones.map((zone) => ({
            zone_id: zone.zoneId,
            zone_label: zone.zoneLabel,
            venue_name: zone.venueName,
            occupancy: zone.currentOccupancy,
            capacity: zone.capacity,
            occupancy_percent: Math.round(zone.currentPercent),
            predicted_occupancy: zone.predictedOccupancy,
            predicted_percent: Math.round(zone.predictedPercent),
            trend: zone.trend,
            available_volunteers_at_venue: zone.availableVolunteers,
            snapshot_time: zone.currentRecordedAt,
        })),
    })}\n\nReturn up to three staffing recommendations for the zones with the greatest operational pressure. Use only DATA facts. Do not invent staff counts, capabilities, adjacent-zone conditions, or actions already taken. Recommendations advise a human operator and must not claim execution.`;
}

function isAllowed<T extends readonly string[]>(
    value: unknown,
    values: T
): value is T[number] {
    return typeof value === "string" && values.includes(value);
}

function limitedString(value: unknown, maximum = 500): string | null {
    return typeof value === "string" && value.trim()
        ? value.trim().slice(0, maximum)
        : null;
}

export function parseResourceAdvisor(
    raw: string,
    zones: AdvisorZoneSnapshot[],
    fallback: ResourceAdvisorResult
): ResourceAdvisorResult {
    try {
        const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
        if (!Array.isArray(parsed.recommendations)) return fallback;

        const byId = new Map(zones.map((zone) => [zone.zoneId, zone]));
        const recommendations: ResourceRecommendation[] = [];

        for (const candidate of parsed.recommendations.slice(0, 3)) {
            if (!candidate || typeof candidate !== "object") return fallback;
            const item = candidate as Record<string, unknown>;
            const zoneId = limitedString(item.zoneId, 100);
            const zone = zoneId ? byId.get(zoneId) : undefined;
            const action = limitedString(item.action);
            const rationale = limitedString(item.rationale);
            const evidence = limitedString(item.evidence);
            const limitations = limitedString(item.limitations);
            if (
                !zone ||
                !action ||
                !rationale ||
                !evidence ||
                !limitations ||
                !isAllowed(item.urgency, ADVISOR_URGENCIES) ||
                !isAllowed(item.confidence, ADVISOR_CONFIDENCE_LEVELS)
            ) {
                return fallback;
            }

            recommendations.push({
                zoneId: zone.zoneId,
                zoneLabel: zone.zoneLabel,
                venueName: zone.venueName,
                action,
                rationale,
                evidence,
                limitations,
                urgency: item.urgency,
                confidence: item.confidence,
            });
        }

        if (recommendations.length === 0) return fallback;
        return {
            source: "ai",
            horizonMinutes: fallback.horizonMinutes,
            snapshotTime:
                limitedString(parsed.snapshotTime, 100) ?? fallback.snapshotTime,
            recommendations,
        };
    } catch {
        return fallback;
    }
}

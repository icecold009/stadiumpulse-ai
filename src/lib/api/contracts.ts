export const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ValidationResult<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

export type AlertAction = "accept" | "reject" | "handled";

export function parseCopilotQuestion(body: unknown): ValidationResult<string> {
    const question =
        body && typeof body === "object"
            ? (body as { question?: unknown }).question
            : undefined;
    if (typeof question !== "string") {
        return { ok: false, error: "question is required and must be a string." };
    }
    const trimmed = question.trim();
    if (!trimmed) return { ok: false, error: "question must not be empty." };
    if (trimmed.length > 500) {
        return { ok: false, error: "question must be 500 characters or fewer." };
    }
    return { ok: true, value: trimmed };
}

export type CopilotContextRequest = {
    question: string;
    zoneId?: string;
    venueId?: string;
    gateId?: string;
    alertId?: string;
    metricType?: "energy_kwh" | "water_l" | "waste_diverted_pct";
};

export function parseCopilotContext(body: unknown): ValidationResult<CopilotContextRequest> {
    const questionResult = parseCopilotQuestion(body);
    if (!questionResult.ok) return questionResult;

    const record = body && typeof body === "object"
        ? body as { zoneId?: unknown; venueId?: unknown; gateId?: unknown; alertId?: unknown; metricType?: unknown }
        : {};
    for (const [key, value] of [["zoneId", record.zoneId], ["venueId", record.venueId], ["gateId", record.gateId], ["alertId", record.alertId]] as const) {
        if (value !== undefined && (typeof value !== "string" || !UUID_PATTERN.test(value))) {
            return { ok: false, error: `${key} must be a valid UUID when provided.` };
        }
    }
    if (record.metricType !== undefined && !["energy_kwh", "water_l", "waste_diverted_pct"].includes(record.metricType as string)) {
        return { ok: false, error: "metricType must be a supported sustainability metric when provided." };
    }

    const value: CopilotContextRequest = { question: questionResult.value };
    if (typeof record.zoneId === "string") value.zoneId = record.zoneId;
    if (typeof record.venueId === "string") value.venueId = record.venueId;
    if (typeof record.gateId === "string") value.gateId = record.gateId;
    if (typeof record.alertId === "string") value.alertId = record.alertId;
    if (typeof record.metricType === "string") value.metricType = record.metricType as CopilotContextRequest["metricType"];
    return { ok: true, value };
}

export function parseAlertAction(body: unknown): ValidationResult<AlertAction> {
    const action =
        body && typeof body === "object"
            ? (body as { action?: unknown }).action
            : undefined;
    if (action === "accept" || action === "reject" || action === "handled") {
        return { ok: true, value: action };
    }
    return {
        ok: false,
        error: "action must be accept, reject, or handled.",
    };
}

export function parseVolunteerZoneId(
    body: unknown
): ValidationResult<string | null> {
    const zoneId =
        body && typeof body === "object"
            ? (body as { zoneId?: unknown }).zoneId
            : undefined;
    if (zoneId === null) return { ok: true, value: null };
    if (typeof zoneId === "string" && UUID_PATTERN.test(zoneId)) {
        return { ok: true, value: zoneId };
    }
    return { ok: false, error: "zoneId must be a valid UUID or null." };
}

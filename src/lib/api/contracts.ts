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

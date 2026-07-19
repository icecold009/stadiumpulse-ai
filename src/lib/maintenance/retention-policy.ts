export const COPILOT_QUERY_RETENTION_HOURS = 24;

export function copilotRetentionCutoff(
    now: Date = new Date(),
    retentionHours = COPILOT_QUERY_RETENTION_HOURS
): string {
    if (!Number.isFinite(retentionHours) || retentionHours <= 0) {
        throw new Error("retentionHours must be a positive finite number.");
    }

    return new Date(now.getTime() - retentionHours * 60 * 60 * 1_000).toISOString();
}

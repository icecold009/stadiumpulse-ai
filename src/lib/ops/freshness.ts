import type { DataFreshness, FreshnessState } from "@/lib/ops/types";

export const FRESHNESS_THRESHOLDS_SECONDS = {
    fresh: 5 * 60,
    stale: 15 * 60,
} as const;

export function classifyFreshness(
    observedAt: string | null | undefined,
    now = Date.now()
): DataFreshness {
    if (!observedAt) {
        return { state: "missing", observedAt: null, ageSeconds: null };
    }

    const timestamp = Date.parse(observedAt);
    if (!Number.isFinite(timestamp)) {
        return { state: "missing", observedAt: null, ageSeconds: null };
    }

    const ageSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    const state: FreshnessState =
        ageSeconds <= FRESHNESS_THRESHOLDS_SECONDS.fresh
            ? "fresh"
            : ageSeconds <= FRESHNESS_THRESHOLDS_SECONDS.stale
                ? "stale"
                : "missing";

    return { state, observedAt, ageSeconds };
}

export function newestTimestamp(values: Array<string | null | undefined>): string | null {
    return values
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

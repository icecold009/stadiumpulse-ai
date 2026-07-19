type Identified = { id: string | number };
type Timestamped = Identified & { recorded_at: string };

function timestamp(value: string): number {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

export function mergeNewestById<T extends Timestamped>(
    previous: T[],
    next: T,
    limit: number
): T[] {
    return [next, ...previous.filter((row) => row.id !== next.id)]
        .sort((a, b) => timestamp(b.recorded_at) - timestamp(a.recorded_at))
        .slice(0, limit);
}

export function upsertRealtimeRow<T extends Identified>(
    previous: T[],
    next: T
): T[] {
    const index = previous.findIndex((row) => row.id === next.id);
    if (index === -1) return [next, ...previous];
    const copy = [...previous];
    copy[index] = { ...copy[index], ...next };
    return copy;
}

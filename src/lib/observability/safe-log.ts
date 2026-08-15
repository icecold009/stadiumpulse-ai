export type SafeLogContext = {
    requestId?: string;
    subject?: string;
    role?: string;
    venueId?: string | null;
    status?: number;
    durationMs?: number;
    count?: number;
    message?: string;
};

export function requestIdFrom(request: Request): string {
    const supplied = request.headers.get("x-request-id");
    return supplied && /^[a-zA-Z0-9._:-]{1,120}$/.test(supplied)
        ? supplied
        : crypto.randomUUID();
}

export function logServerEvent(event: string, context: SafeLogContext = {}) {
    console.info(`[pulseops] ${JSON.stringify({
        event,
        at: new Date().toISOString(),
        ...context,
    })}`);
}

export function logServerError(event: string, context: SafeLogContext = {}) {
    console.error(`[pulseops] ${JSON.stringify({
        event,
        at: new Date().toISOString(),
        ...context,
    })}`);
}

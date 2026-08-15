import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { loadOpsSnapshot } from "@/lib/ops/load-snapshot";
import { logServerError, logServerEvent, requestIdFrom } from "@/lib/observability/safe-log";

const ALLOWED_WINDOWS = new Set([15, 60, 1440]);

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const requestId = requestIdFrom(request);
    const startedAt = Date.now();
    const venueId = request.nextUrl.searchParams.get("venueId");
    const rawWindow = request.nextUrl.searchParams.get("windowMinutes");
    const windowMinutes = rawWindow ? Number(rawWindow) : 60;

    if (!Number.isInteger(windowMinutes) || !ALLOWED_WINDOWS.has(windowMinutes)) {
        return NextResponse.json(
            { error: "windowMinutes must be 15, 60, or 1440." },
            { status: 400 }
        );
    }

    const result = await loadOpsSnapshot(venueId, windowMinutes);
    if (!result.ok) {
        logServerError("ops_snapshot_failed", { requestId, venueId, status: result.status, message: result.error, durationMs: Date.now() - startedAt });
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    logServerEvent("ops_snapshot_served", { requestId, venueId: result.snapshot.selectedVenueId, status: 200, count: result.snapshot.zones.length, durationMs: Date.now() - startedAt });

    return NextResponse.json(
        { snapshot: result.snapshot },
        { headers: { "Cache-Control": "no-store", "x-request-id": requestId } }
    );
}

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { resolveVenueScope } from "@/lib/auth/venue-scope";
import { loadOpsSnapshot } from "@/lib/ops/load-snapshot";
import { logServerEvent, requestIdFrom } from "@/lib/observability/safe-log";

const WINDOWS = new Set([15, 60, 1440]);

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const requestId = requestIdFrom(request);
    const rawWindow = Number(request.nextUrl.searchParams.get("windowMinutes") ?? "60");
    if (!Number.isInteger(rawWindow) || !WINDOWS.has(rawWindow)) {
        return NextResponse.json({ error: "windowMinutes must be 15, 60, or 1440." }, { status: 400 });
    }

    const scopeResult = await resolveVenueScope();
    if (!scopeResult.ok) return NextResponse.json({ error: scopeResult.error }, { status: scopeResult.status });
    if (scopeResult.scope.role !== "admin") {
        return NextResponse.json({ error: "Venue comparison is limited to Admin." }, { status: 403 });
    }

    const snapshotResult = await loadOpsSnapshot(null, rawWindow);
    if (!snapshotResult.ok) return NextResponse.json({ error: snapshotResult.error }, { status: snapshotResult.status });

    const rows = scopeResult.scope.venues.map((venue) => {
        const zones = snapshotResult.snapshot.zones.filter((zone) => zone.venueId === venue.id);
        const gates = snapshotResult.snapshot.gates.filter((gate) => gate.venueId === venue.id);
        const alerts = snapshotResult.snapshot.alerts.filter((alert) => alert.venueId === venue.id);
        const capacity = zones.reduce((sum, zone) => sum + zone.capacity, 0);
        const occupancy = zones.reduce((sum, zone) => sum + (zone.occupancy ?? 0), 0);
        return {
            venueId: venue.id,
            venueName: venue.name,
            occupancyPercent: capacity > 0 ? (occupancy / capacity) * 100 : null,
            criticalZones: zones.filter((zone) => zone.status === "critical").length,
            watchZones: zones.filter((zone) => zone.status === "watch").length,
            openAlerts: alerts.length,
            gateScans: gates.reduce((sum, gate) => sum + (gate.currentScans ?? 0), 0),
            freshness: zones.length > 0 ? zones[0].freshness.state : "missing",
        };
    });

    logServerEvent("venue_comparison_served", { requestId, status: 200, count: rows.length });
    return NextResponse.json({ fetchedAt: snapshotResult.snapshot.fetchedAt, windowMinutes: rawWindow, venues: rows }, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
}

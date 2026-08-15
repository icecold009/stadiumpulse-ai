import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { UUID_PATTERN } from "@/lib/api/contracts";
import { resolveVenueScope } from "@/lib/auth/venue-scope";
import { loadOpsSnapshot } from "@/lib/ops/load-snapshot";
import { buildMatchSummary, matchSummaryCsv } from "@/lib/reports/match-summary";
import { logServerEvent, requestIdFrom } from "@/lib/observability/safe-log";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const requestId = requestIdFrom(request);
    const venueId = request.nextUrl.searchParams.get("venueId");
    const format = request.nextUrl.searchParams.get("format") ?? "json";
    if (!venueId || !UUID_PATTERN.test(venueId)) {
        return NextResponse.json({ error: "A valid venueId is required." }, { status: 400 });
    }
    if (format !== "json" && format !== "csv") {
        return NextResponse.json({ error: "format must be json or csv." }, { status: 400 });
    }

    const scopeResult = await resolveVenueScope(venueId);
    if (!scopeResult.ok) return NextResponse.json({ error: scopeResult.error }, { status: scopeResult.status });
    if (scopeResult.scope.role !== "admin") {
        return NextResponse.json({ error: "Match summaries are limited to Admin." }, { status: 403 });
    }

    const venue = scopeResult.scope.venues.find((candidate) => candidate.id === venueId);
    if (!venue) return NextResponse.json({ error: "Venue is not available." }, { status: 403 });
    const snapshotResult = await loadOpsSnapshot(venueId, 1440);
    if (!snapshotResult.ok) return NextResponse.json({ error: snapshotResult.error }, { status: snapshotResult.status });

    const summary = buildMatchSummary(snapshotResult.snapshot, venue);
    logServerEvent("match_summary_served", { requestId, venueId, status: 200 });
    if (format === "csv") {
        return new Response(matchSummaryCsv(summary), {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="pulseops-${venue.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-summary.csv"`,
                "Cache-Control": "no-store",
            },
        });
    }

    return NextResponse.json({ summary }, { headers: { "Cache-Control": "no-store" } });
}

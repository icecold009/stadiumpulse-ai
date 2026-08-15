// src/app/api/alerts/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole } from "@/lib/auth/roles";
import { resolveVenueScope } from "@/lib/auth/venue-scope";
import { UUID_PATTERN } from "@/lib/api/contracts";

const SEVERITIES = new Set(["warn", "critical"]);
const STATUSES = new Set(["open", "handled"]);
const AGE_FILTERS = new Set([5, 15, 30, 60]);

export async function GET(request: NextRequest) {
    const db = await createSupabaseServerClient();
    const {
        data: { user },
    } = await db.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: roleRow } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        !isRole(roleRow?.role) ||
        !["admin", "ops_manager"].includes(roleRow.role)
    ) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const requestedVenueId = request.nextUrl.searchParams.get("venueId");
    const severity = request.nextUrl.searchParams.get("severity");
    const status = request.nextUrl.searchParams.get("status") ?? "open";
    const rawAgeMinutes = request.nextUrl.searchParams.get("ageMinutes");
    const ageMinutes = rawAgeMinutes ? Number(rawAgeMinutes) : null;
    if (requestedVenueId && !UUID_PATTERN.test(requestedVenueId)) {
        return NextResponse.json({ error: "Invalid venue id." }, { status: 400 });
    }
    if (!SEVERITIES.has(severity ?? "") && severity) {
        return NextResponse.json({ error: "Invalid alert severity." }, { status: 400 });
    }
    if (!STATUSES.has(status)) {
        return NextResponse.json({ error: "Invalid alert status." }, { status: 400 });
    }
    if (rawAgeMinutes && (!Number.isInteger(ageMinutes) || !AGE_FILTERS.has(ageMinutes as number))) {
        return NextResponse.json({ error: "ageMinutes must be 5, 15, 30, or 60." }, { status: 400 });
    }

    const scope = await resolveVenueScope(requestedVenueId);
    if (!scope.ok) {
        return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    let query = db
        .from("alerts")
        .select("*, zones(label, capacity)")
        .in("venue_id", scope.scope.queryVenueIds)
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(50);

    if (severity) query = query.eq("severity", severity);
    if (ageMinutes) {
        query = query.lte("created_at", new Date(Date.now() - ageMinutes * 60 * 1000).toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error("[alerts] scoped alert query failed", { message: error.message });
        return NextResponse.json({ error: "Could not load alerts." }, { status: 500 });
    }

    return NextResponse.json({ alerts: data });
}

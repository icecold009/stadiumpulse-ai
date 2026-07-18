import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type VolunteerUpdate = Database["public"]["Tables"]["volunteers"]["Update"];

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
        return NextResponse.json({ error: "Invalid volunteer id." }, { status: 400 });
    }

    let zoneId: unknown;
    try {
        ({ zoneId } = (await request.json()) as { zoneId?: unknown });
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    if (zoneId !== null && (typeof zoneId !== "string" || !UUID_PATTERN.test(zoneId))) {
        return NextResponse.json(
            { error: "zoneId must be a valid UUID or null." },
            { status: 400 }
        );
    }

    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { data: volunteer, error: volunteerError } = await supabase
        .from("volunteers")
        .select("id, venue_id")
        .eq("id", id)
        .maybeSingle();
    if (volunteerError || !volunteer) {
        return NextResponse.json({ error: "Volunteer not found." }, { status: 404 });
    }

    if (typeof zoneId === "string") {
        const { data: zone, error: zoneError } = await supabase
            .from("zones")
            .select("id, venue_id")
            .eq("id", zoneId)
            .maybeSingle();
        if (zoneError || !zone || zone.venue_id !== volunteer.venue_id) {
            return NextResponse.json(
                { error: "The destination zone must belong to the volunteer's venue." },
                { status: 400 }
            );
        }
    }

    const update: VolunteerUpdate = {
        zone_id: typeof zoneId === "string" ? zoneId : null,
        status: typeof zoneId === "string" ? "assigned" : "available",
    };
    const { data, error } = await supabase
        .from("volunteers")
        .update(update)
        .eq("id", id)
        .select("id, venue_id, zone_id, name, status")
        .single();

    if (error) {
        console.error("[volunteers] reassignment failed", {
            volunteerId: id,
            userId: user.id,
            message: error.message,
        });
        return NextResponse.json(
            { error: "You are not authorized to reassign this volunteer." },
            { status: 403 }
        );
    }

    return NextResponse.json({ volunteer: data });
}

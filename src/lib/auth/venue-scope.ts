import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole } from "@/lib/auth/roles";
import {
    buildVenueScope,
    type VenueScopeResult,
} from "@/lib/auth/venue-scope-policy";

export type { AccessibleVenue, VenueScope, VenueScopeResult } from "@/lib/auth/venue-scope-policy";

type ServerVenueScopeResult = VenueScopeResult | {
    ok: false;
    status: 401 | 500;
    error: string;
};

export async function resolveVenueScope(
    requestedVenueId?: string | null
): Promise<ServerVenueScopeResult> {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { ok: false, status: 401, error: "Unauthorized." };
    }

    const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (roleError) {
        console.error("[venue-scope] role lookup failed", {
            userId: user.id,
            message: roleError.message,
        });
        return { ok: false, status: 500, error: "Failed to resolve venue access." };
    }

    if (!isRole(roleRow?.role)) {
        return { ok: false, status: 403, error: "A valid operator role is required." };
    }

    const query = supabase.from("venues").select("id, name").order("name");
    if (roleRow.role !== "admin") {
        const { data: accessRows, error: accessError } = await supabase
            .from("user_venue_access")
            .select("venue_id, venues(name)")
            .eq("user_id", user.id);

        if (accessError) {
            console.error("[venue-scope] access lookup failed", {
                userId: user.id,
                message: accessError.message,
            });
            return { ok: false, status: 500, error: "Failed to resolve venue access." };
        }

        const venues = (accessRows ?? [])
            .map((row) => {
                const venue = row.venues as { name?: string } | null;
                return { id: row.venue_id, name: venue?.name ?? "Unknown venue" };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        return buildVenueScope(roleRow.role, venues, requestedVenueId);
    }

    const { data: venues, error: venuesError } = await query;
    if (venuesError) {
        console.error("[venue-scope] venue lookup failed", {
            userId: user.id,
            message: venuesError.message,
        });
        return { ok: false, status: 500, error: "Failed to resolve venue access." };
    }

    return buildVenueScope(
        roleRow.role,
        (venues ?? []).map((venue) => ({ id: venue.id, name: venue.name })),
        requestedVenueId
    );
}

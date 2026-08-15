import type { Role } from "./roles.ts";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AccessibleVenue = {
    id: string;
    name: string;
};

export type VenueScope = {
    role: Role;
    venues: AccessibleVenue[];
    allowedVenueIds: string[];
    selectedVenueId: string | null;
    queryVenueIds: string[];
    isAllVenues: boolean;
};

export type VenueScopeResult =
    | { ok: true; scope: VenueScope }
    | { ok: false; status: 400 | 403; error: string };

export function buildVenueScope(
    role: Role,
    venues: AccessibleVenue[],
    requestedVenueId?: string | null
): VenueScopeResult {
    if (requestedVenueId && !UUID_PATTERN.test(requestedVenueId)) {
        return { ok: false, status: 400, error: "Invalid venue id." };
    }

    const allowedVenueIds = venues.map((venue) => venue.id);
    if (venues.length === 0) {
        return { ok: false, status: 403, error: "No venue access is assigned to this account." };
    }

    if (requestedVenueId && !allowedVenueIds.includes(requestedVenueId)) {
        return { ok: false, status: 403, error: "This account cannot access the selected venue." };
    }

    const isAllVenues = role === "admin" && !requestedVenueId;
    const selectedVenueId = requestedVenueId ?? (role === "admin" ? null : allowedVenueIds[0]);
    const queryVenueIds = selectedVenueId ? [selectedVenueId] : allowedVenueIds;

    return {
        ok: true,
        scope: {
            role,
            venues,
            allowedVenueIds,
            selectedVenueId,
            queryVenueIds,
            isAllVenues,
        },
    };
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPinned } from "lucide-react";
import type { AccessibleVenue } from "@/lib/auth/venue-scope-policy";

type Props = {
    role: "admin" | "ops_manager" | "sustainability_lead" | "volunteer_coordinator";
    venues: AccessibleVenue[];
};

export default function VenueScopeSelector({ role, venues }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const selectedVenueId = searchParams.get("venueId") ?? (role === "admin" ? "all" : venues[0]?.id ?? "");

    if (venues.length === 0) return null;

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") params.delete("venueId");
        else params.set("venueId", value);
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    }

    return (
        <label className="flex min-w-[220px] items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-muted">
            <MapPinned aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
            <span className="sr-only">Venue scope</span>
            <select
                value={selectedVenueId}
                onChange={(event) => handleChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-medium text-foreground outline-none"
                aria-label="Venue scope"
            >
                {role === "admin" ? <option value="all">All venues</option> : null}
                {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                        {venue.name}
                    </option>
                ))}
            </select>
        </label>
    );
}

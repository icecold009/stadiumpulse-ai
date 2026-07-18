"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];

function upsertById(prev: VolunteerRow[], next: VolunteerRow): VolunteerRow[] {
    const idx = prev.findIndex((r) => r.id === next.id);
    if (idx === -1) return [next, ...prev];
    const copy = [...prev];
    copy[idx] = { ...copy[idx], ...next };
    return copy;
}

export function useRealtimeVolunteers(initialData: VolunteerRow[]) {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [volunteers, setVolunteers] = useState<VolunteerRow[]>(initialData);

    useEffect(() => {
        // Realtime for public.volunteers must be enabled in Supabase replication settings.
        const channel = supabase
            .channel(`volunteers_changes_${subscriptionId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "volunteers" },
                (payload) => {
                    setVolunteers((prev) => upsertById(prev, payload.new as VolunteerRow));
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "volunteers" },
                (payload) => {
                    setVolunteers((prev) => upsertById(prev, payload.new as VolunteerRow));
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [subscriptionId, supabase]);

    return volunteers;
}

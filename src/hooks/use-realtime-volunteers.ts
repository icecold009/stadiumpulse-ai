"use client";

import { useEffect, useMemo, useState } from "react";
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
    const [volunteers, setVolunteers] = useState<VolunteerRow[]>(initialData);

    useEffect(() => {
        setVolunteers(initialData);
    }, [initialData]);

    useEffect(() => {
        // Realtime for public.volunteers must be enabled in Supabase replication settings.
        const channel = supabase
            .channel("volunteers_changes")
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
    }, [supabase]);

    return volunteers;
}
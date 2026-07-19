"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertRealtimeRow } from "@/lib/realtime/reducers";
import type { Database } from "@/types/database";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];

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
                    setVolunteers((prev) => upsertRealtimeRow(prev, payload.new as VolunteerRow));
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "volunteers" },
                (payload) => {
                    setVolunteers((prev) => upsertRealtimeRow(prev, payload.new as VolunteerRow));
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [subscriptionId, supabase]);

    return volunteers;
}

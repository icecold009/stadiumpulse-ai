"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertRealtimeRow } from "@/lib/realtime/reducers";
import type { Database } from "@/types/database";

type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

export function useRealtimeAlerts(initialData: AlertRow[]) {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [alerts, setAlerts] = useState<AlertRow[]>(initialData);

    useEffect(() => {
        // Realtime for public.alerts must be enabled in Supabase replication settings.
        const channel = supabase
            .channel(`alerts_changes_${subscriptionId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "alerts" },
                (payload) => {
                    setAlerts((prev) => upsertRealtimeRow(prev, payload.new as AlertRow));
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "alerts" },
                (payload) => {
                    setAlerts((prev) => upsertRealtimeRow(prev, payload.new as AlertRow));
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [subscriptionId, supabase]);

    return alerts;
}

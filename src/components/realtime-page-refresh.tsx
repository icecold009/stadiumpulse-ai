"use client";

import { useEffect, useId, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RealtimeTable =
    | "zone_telemetry"
    | "gate_scans"
    | "sustainability_metrics"
    | "alerts"
    | "volunteers";

export default function RealtimePageRefresh({ tables }: { tables: RealtimeTable[] }) {
    const router = useRouter();
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const tableKey = tables.join(",");

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        let channel = supabase.channel(`page_refresh_${subscriptionId}`);

        const refresh = () => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => router.refresh(), 250);
        };

        for (const table of tableKey.split(",").filter(Boolean) as RealtimeTable[]) {
            channel = channel.on(
                "postgres_changes",
                { event: "*", schema: "public", table },
                refresh
            );
        }

        channel.subscribe();

        return () => {
            if (timeout) clearTimeout(timeout);
            void supabase.removeChannel(channel);
        };
    }, [router, subscriptionId, supabase, tableKey]);

    return null;
}

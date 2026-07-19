"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mergeNewestById } from "@/lib/realtime/reducers";
import type { Database } from "@/types/database";

type GateScanRow = Database["public"]["Tables"]["gate_scans"]["Row"];

function toMs(value: string): number {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

export function useRealtimeGateScans(initialData: GateScanRow[]) {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [rows, setRows] = useState<GateScanRow[]>(() =>
        [...initialData]
            .sort((a, b) => toMs(b.recorded_at) - toMs(a.recorded_at))
            .slice(0, 500)
    );

    useEffect(() => {
        const channel = supabase
            .channel(`gate_scan_changes_${subscriptionId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "gate_scans" },
                (payload) => {
                    setRows((previous) =>
                        mergeNewestById(previous, payload.new as GateScanRow, 500)
                    );
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [subscriptionId, supabase]);

    return rows;
}

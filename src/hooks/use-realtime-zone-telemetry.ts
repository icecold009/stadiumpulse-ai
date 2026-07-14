"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ZoneTelemetryRow = Database["public"]["Tables"]["zone_telemetry"]["Row"];

function toMs(value: string | null): number {
    if (!value) return 0;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

function sortNewestFirst(rows: ZoneTelemetryRow[]): ZoneTelemetryRow[] {
    return [...rows].sort((a, b) => toMs(b.recorded_at) - toMs(a.recorded_at));
}

function mergeTelemetry(
    prev: ZoneTelemetryRow[],
    next: ZoneTelemetryRow
): ZoneTelemetryRow[] {
    const withoutDup = prev.filter((r) => r.id !== next.id);
    return sortNewestFirst([next, ...withoutDup]).slice(0, 200);
}

export function useRealtimeZoneTelemetry(initialData: ZoneTelemetryRow[]) {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [rows, setRows] = useState<ZoneTelemetryRow[]>(
        sortNewestFirst(initialData).slice(0, 200)
    );

    useEffect(() => {
        setRows(sortNewestFirst(initialData).slice(0, 200));
    }, [initialData]);

    useEffect(() => {
        // Realtime for public.zone_telemetry must be enabled in Supabase replication settings.
        const channel = supabase
            .channel("zone_telemetry_changes")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "zone_telemetry" },
                (payload) => {
                    const inserted = payload.new as ZoneTelemetryRow;
                    setRows((prev) => mergeTelemetry(prev, inserted));
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [supabase]);

    return rows;
}
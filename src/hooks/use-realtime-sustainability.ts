"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mergeNewestById } from "@/lib/realtime/reducers";
import type { Database } from "@/types/database";

type SustainabilityRow =
    Database["public"]["Tables"]["sustainability_metrics"]["Row"];

function toMs(value: string): number {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

export function useRealtimeSustainability(initialData: SustainabilityRow[]) {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [rows, setRows] = useState<SustainabilityRow[]>(() =>
        [...initialData].sort(
            (a, b) => toMs(b.recorded_at) - toMs(a.recorded_at)
        )
    );

    useEffect(() => {
        const channel = supabase
            .channel(`sustainability_changes_${subscriptionId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "sustainability_metrics",
                },
                (payload) => {
                    setRows((previous) =>
                        mergeNewestById(
                            previous,
                            payload.new as SustainabilityRow,
                            1000
                        )
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

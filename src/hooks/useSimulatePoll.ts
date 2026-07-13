"use client";
import { useEffect } from "react";

export function useSimulatePoll(intervalMs = 30_000) {
    useEffect(() => {
        const tick = () =>
            fetch("/api/simulate-tick", { method: "POST" })
                .then((r) => r.json())
                .then((d: unknown) => console.debug("[simulate-tick]", d))
                .catch((e: unknown) => console.error("[simulate-tick] failed", e));

        tick(); // fire immediately on mount
        const id = setInterval(tick, intervalMs);
        return () => clearInterval(id); // cleanup on unmount
    }, [intervalMs]);
}
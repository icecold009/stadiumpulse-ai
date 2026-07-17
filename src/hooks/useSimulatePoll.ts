"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useSimulatePoll(intervalMs = 30_000) {
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const tick = () =>
            fetch("/api/simulate-tick", { method: "POST" })
                .then(async (response) => {
                    const contentType = response.headers.get("content-type") ?? "";
                    const payload = contentType.includes("application/json")
                        ? await response.json()
                        : await response.text();

                    if (!response.ok) {
                        throw new Error(
                            typeof payload === "string"
                                ? `HTTP ${response.status}: ${payload.slice(0, 200)}`
                                : (payload as { error?: string }).error ?? `HTTP ${response.status}`
                        );
                    }

                    return payload;
                })
                .then((d: unknown) => {
                    console.debug("[simulate-tick]", d);
                    if (mounted) router.refresh();
                })
                .catch((e: unknown) => console.error("[simulate-tick] failed", e));

        tick();
        const id = setInterval(tick, intervalMs);

        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, [intervalMs, router]);
}
"use client";

import { useEffect } from "react";

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[ui] application error", {
            digest: error.digest,
            message: error.message,
        });
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
            <section className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
                <h1 className="text-xl font-semibold">PulseOps hit a temporary problem</h1>
                <p className="mt-2 text-sm text-text-muted">
                    No operational action was taken. Retry this screen or return to the dashboard.
                </p>
                <button
                    type="button"
                    onClick={reset}
                    className="mt-5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background"
                >
                    Try again
                </button>
            </section>
        </main>
    );
}

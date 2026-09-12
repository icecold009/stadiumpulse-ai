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
            <section className="panel panel-raised max-w-md p-8 text-center">
                <p className="eyebrow text-status-critical">System pause</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">PulseOps hit a temporary problem</h1>
                <p className="mt-2 text-sm text-text-muted">
                    No operational action was taken. Retry this screen or return to the dashboard.
                </p>
                <button
                    type="button"
                    onClick={reset}
                    className="control button-primary mt-5"
                >
                    Try again
                </button>
            </section>
        </main>
    );
}

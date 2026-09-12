"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
    return (
        <html lang="en">
            <body className="bg-background text-foreground">
                <main className="flex min-h-screen items-center justify-center p-6">
                    <section className="panel panel-raised w-full max-w-md p-8 text-center">
                        <p className="eyebrow text-status-critical">System pause</p>
                        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">PulseOps is temporarily unavailable</h1>
                        <p className="mt-3 text-sm leading-6 text-text-muted">No operational action was taken. Please retry.</p>
                        <button className="control button-primary mt-6" type="button" onClick={reset}>Try again</button>
                    </section>
                </main>
            </body>
        </html>
    );
}

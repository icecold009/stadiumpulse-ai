"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, background: "#0b0f14", color: "#edeff2" }}>
                <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
                    <section style={{ maxWidth: 480, textAlign: "center" }}>
                        <h1>PulseOps is temporarily unavailable</h1>
                        <p>No operational action was taken. Please retry.</p>
                        <button type="button" onClick={reset}>Try again</button>
                    </section>
                </main>
            </body>
        </html>
    );
}

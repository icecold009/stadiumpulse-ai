"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UnauthorizedPage() {
    const router = useRouter();

    async function signOut() {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
            <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-status-warn">
                    Access not configured
                </p>
                <h1 className="mt-3 text-2xl font-semibold">Account role required</h1>
                <p className="mt-3 text-sm leading-6 text-text-muted">
                    Your account is authenticated, but it does not have a trusted
                    StadiumPulse role. Ask an administrator to add your account to
                    the user roles table.
                </p>
                <button
                    type="button"
                    onClick={signOut}
                    className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background"
                >
                    Sign out
                </button>
            </section>
        </main>
    );
}

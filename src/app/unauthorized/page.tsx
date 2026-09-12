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
            <section className="panel panel-raised w-full max-w-lg p-8 text-center">
                <p className="eyebrow text-status-warn">
                    Access not configured
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Account role required</h1>
                <p className="mt-3 text-sm leading-6 text-text-muted">
                    Your account is authenticated, but it does not have a trusted
                    StadiumPulse role. Ask an administrator to add your account to
                    the user roles table.
                </p>
                <button
                    type="button"
                    onClick={signOut}
                    className="control button-primary mt-6"
                >
                    Sign out
                </button>
            </section>
        </main>
    );
}

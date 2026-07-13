"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Role = "admin" | "ops_manager" | "sustainability_lead" | "volunteer_coordinator";

const roleRedirects: Record<Role, string> = {
    admin: "/overview",
    ops_manager: "/ops",
    sustainability_lead: "/sustainability",
    volunteer_coordinator: "/volunteers",
};

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        const role = data.user?.user_metadata?.role as string | undefined;
        let destination = "/overview";
        if (role === "admin" || role === "ops_manager") destination = "/ops";
        else if (role === "sustainability_lead") destination = "/sustainability";
        else if (role === "volunteer_coordinator") destination = "/volunteers";

        router.refresh();
        router.replace(destination);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(61,214,196,0.12),transparent_34%),linear-gradient(180deg,#0b0f14_0%,#091015_100%)] px-4 py-10 text-[#edeff2]">
            <section className="w-full max-w-md rounded-2xl border border-[#26303a] bg-[#141a21] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-10">
                <div className="mb-8 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#8b96a3]">
                        StadiumPulse AI
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-[#edeff2]">
                        Sign in to continue
                    </h1>
                    <p className="text-sm leading-6 text-[#8b96a3]">
                        Access the operator dashboard with your role-based Supabase account.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#edeff2]">Email</span>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            required
                            className="h-12 w-full rounded-xl border border-[#26303a] bg-[#1c242d] px-4 text-sm text-[#edeff2] outline-none transition placeholder:text-[#64707d] focus:border-[#3dd6c4] focus:ring-2 focus:ring-[#3dd6c4]/25"
                            placeholder="operator@stadiumpulse.ai"
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-[#edeff2]">Password</span>
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            required
                            className="h-12 w-full rounded-xl border border-[#26303a] bg-[#1c242d] px-4 text-sm text-[#edeff2] outline-none transition placeholder:text-[#64707d] focus:border-[#3dd6c4] focus:ring-2 focus:ring-[#3dd6c4]/25"
                            placeholder="Enter your password"
                        />
                    </label>

                    {error && (
                        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#3dd6c4] px-4 text-sm font-semibold text-[#0b0f14] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#3dd6c4] focus:ring-offset-2 focus:ring-offset-[#141a21] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </section>
        </main>
    );
}
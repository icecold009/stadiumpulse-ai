"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { defaultRouteForRole, isRole, type Role } from "@/lib/auth/roles";

const DEMO_ROLES: Array<{ role: Role; label: string; description: string }> = [
    { role: "admin", label: "Admin", description: "Cross-venue overview" },
    { role: "ops_manager", label: "Operations", description: "Crowd and alerts" },
    { role: "sustainability_lead", label: "Sustainability", description: "Venue targets" },
    { role: "volunteer_coordinator", label: "Volunteers", description: "Team deployment" },
];

export default function LoginClient({ demoEnabled }: { demoEnabled: boolean }) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [demoRole, setDemoRole] = useState<Role | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError("Sign-in failed. Check the account details.");
            setLoading(false);
            return;
        }

        const { data: roleRow, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .maybeSingle();

        if (roleError || !isRole(roleRow?.role)) {
            router.replace("/unauthorized");
            return;
        }

        router.refresh();
        router.replace(defaultRouteForRole(roleRow.role));
    }

    async function enterDemo(role: Role) {
        setError(null);
        setDemoRole(role);
        try {
            const response = await fetch("/api/demo-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });
            const payload = (await response.json()) as { redirectTo?: string; error?: string };
            if (!response.ok || !payload.redirectTo) {
                throw new Error(payload.error ?? "Demo access is unavailable.");
            }
            router.refresh();
            router.replace(payload.redirectTo);
        } catch (demoError) {
            setError(demoError instanceof Error ? demoError.message : "Demo access is unavailable.");
            setDemoRole(null);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(61,214,196,0.12),transparent_34%),linear-gradient(180deg,#0b0f14_0%,#091015_100%)] px-4 py-10 text-[#edeff2]">
            <section className="w-full max-w-2xl rounded-2xl border border-[#26303a] bg-[#141a21] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-10">
                <div className="mb-8 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#8b96a3]">StadiumPulse AI</p>
                    <h1 className="text-2xl font-semibold">PulseOps command center</h1>
                    <p className="text-sm leading-6 text-[#8b96a3]">Fictional, simulated World Cup 2026 operations data.</p>
                </div>

                {demoEnabled ? (
                    <section aria-labelledby="demo-heading">
                        <h2 id="demo-heading" className="text-lg font-semibold">Explore the demo</h2>
                        <p className="mt-1 text-sm text-[#8b96a3]">Choose a role. No password is shown or sent to the browser.</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {DEMO_ROLES.map((item) => (
                                <button
                                    key={item.role}
                                    type="button"
                                    onClick={() => void enterDemo(item.role)}
                                    disabled={demoRole !== null || loading}
                                    className="rounded-xl border border-[#26303a] bg-[#1c242d] p-4 text-left transition hover:border-[#3dd6c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3dd6c4] disabled:opacity-60"
                                >
                                    <span className="block font-semibold text-[#edeff2]">{demoRole === item.role ? "Opening..." : item.label}</span>
                                    <span className="mt-1 block text-sm text-[#8b96a3]">{item.description}</span>
                                </button>
                            ))}
                        </div>
                        <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#8b96a3]">
                            <span className="h-px flex-1 bg-[#26303a]" />
                            Operator sign-in
                            <span className="h-px flex-1 bg-[#26303a]" />
                        </div>
                    </section>
                ) : null}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <label className="block space-y-2">
                        <span className="text-sm font-medium">Email</span>
                        <input type="email" name="email" autoComplete="email" required className="h-12 w-full rounded-xl border border-[#26303a] bg-[#1c242d] px-4 text-sm outline-none focus:border-[#3dd6c4] focus:ring-2 focus:ring-[#3dd6c4]/25" placeholder="operator@stadiumpulse.ai" />
                    </label>
                    <label className="block space-y-2">
                        <span className="text-sm font-medium">Password</span>
                        <input type="password" name="password" autoComplete="current-password" required className="h-12 w-full rounded-xl border border-[#26303a] bg-[#1c242d] px-4 text-sm outline-none focus:border-[#3dd6c4] focus:ring-2 focus:ring-[#3dd6c4]/25" placeholder="Enter your password" />
                    </label>
                    {error ? <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p> : null}
                    <button type="submit" disabled={loading || demoRole !== null} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#3dd6c4] px-4 text-sm font-semibold text-[#0b0f14] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3dd6c4] disabled:opacity-60">
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </section>
        </main>
    );
}

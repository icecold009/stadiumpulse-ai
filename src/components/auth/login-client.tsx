"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { defaultRouteForRole, isRole, type Role } from "@/lib/auth/roles";
import { Activity, ArrowRight, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/theme/theme-toggle";

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
        <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-8 sm:py-8">
            <div className="mx-auto flex w-full max-w-6xl justify-end"><ThemeToggle /></div>
            <div className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                <section className="space-y-8">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent-strong/50 bg-accent-soft text-accent-strong">
                                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="eyebrow">StadiumPulse AI</p>
                                <p className="text-lg font-semibold tracking-[-0.03em]">PulseOps</p>
                            </div>
                        </div>
                        <p className="eyebrow mt-12">Operations intelligence</p>
                        <h1 className="mt-3 max-w-lg text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.07em]">Make the next stadium decision with confidence.</h1>
                        <p className="mt-6 max-w-lg text-base leading-7 text-text-muted">A grounded command center for crowd flow, sustainability, volunteers, and the human decisions that keep match day moving.</p>
                    </div>
                    <div className="grid max-w-xl gap-3 sm:grid-cols-3">
                        {[
                            ["Signal", "Live venue telemetry"],
                            ["Risk", "Evidence, not guesswork"],
                            ["Decision", "Human-controlled action"],
                        ].map(([label, description]) => (
                            <div key={label} className="border-l-2 border-accent-strong/50 pl-3">
                                <p className="text-sm font-semibold">{label}</p>
                                <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
                            </div>
                        ))}
                    </div>
                    <p className="flex items-center gap-2 text-xs text-text-subtle"><Activity aria-hidden="true" className="h-3.5 w-3.5 text-status-ok" /> Fictional World Cup 2026 venue data · simulated environment</p>
                </section>

                <section className="panel panel-raised p-6 sm:p-8">
                    <div className="mb-7 space-y-2">
                        <p className="eyebrow">Operator access</p>
                        <h2 className="text-2xl font-semibold tracking-[-0.04em]">Enter the command center</h2>
                        <p className="text-sm leading-6 text-text-muted">Use a demo role or sign in with an authorized operator account.</p>
                    </div>

                {demoEnabled ? (
                    <section aria-labelledby="demo-heading">
                        <h3 id="demo-heading" className="text-sm font-semibold">Explore the demo</h3>
                        <p className="mt-1 text-sm text-text-muted">Choose a role. No password is shown or sent to the browser.</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {DEMO_ROLES.map((item) => (
                                <button
                                    key={item.role}
                                    type="button"
                                    onClick={() => void enterDemo(item.role)}
                                    disabled={demoRole !== null || loading}
                                    className="control button-secondary min-h-[76px] w-full flex-col items-start p-4 text-left"
                                >
                                    <span className="block text-sm font-semibold text-foreground">{demoRole === item.role ? "Opening..." : item.label}</span>
                                    <span className="mt-1 block text-xs font-normal text-text-muted">{item.description}</span>
                                </button>
                            ))}
                        </div>
                        <div className="my-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-subtle">
                            <span className="h-px flex-1 bg-border" />
                            Operator sign-in
                            <span className="h-px flex-1 bg-border" />
                        </div>
                    </section>
                ) : null}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <label className="block space-y-2">
                        <span className="text-sm font-semibold">Email</span>
                        <input type="email" name="email" autoComplete="email" required className="h-12 w-full rounded-[10px] border border-border bg-surface-muted px-4 text-sm outline-none placeholder:text-text-subtle focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20" placeholder="operator@stadiumpulse.ai" />
                    </label>
                    <label className="block space-y-2">
                        <span className="text-sm font-semibold">Password</span>
                        <input type="password" name="password" autoComplete="current-password" required className="h-12 w-full rounded-[10px] border border-border bg-surface-muted px-4 text-sm outline-none placeholder:text-text-subtle focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20" placeholder="Enter your password" />
                    </label>
                    {error ? <p role="alert" className="rounded-[10px] border border-status-critical/45 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">{error}</p> : null}
                    <button type="submit" disabled={loading || demoRole !== null} className="control button-primary h-12 w-full">
                        {loading ? "Signing in..." : "Sign in"} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                </form>
                </section>
            </div>
        </main>
    );
}

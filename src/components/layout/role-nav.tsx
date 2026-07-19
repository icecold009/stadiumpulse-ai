"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
    Bell,
    ChartNoAxesCombined,
    Leaf,
    LogOut,
    ShieldCheck,
    Users,
    Waves,
    type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth/roles";

type NavItem = {
    href: string;
    label: string;
    roles: Role[];
    icon: LucideIcon;
};

const navItems: NavItem[] = [
    {
        href: "/overview",
        label: "Overview",
        roles: ["admin"],
        icon: ChartNoAxesCombined,
    },
    {
        href: "/ops",
        label: "Ops",
        roles: ["admin", "ops_manager"],
        icon: Waves,
    },
    {
        href: "/ops/alerts",
        label: "Alerts",
        roles: ["admin", "ops_manager"],
        icon: Bell,
    },
    {
        href: "/sustainability",
        label: "Sustainability",
        roles: ["admin", "sustainability_lead"],
        icon: Leaf,
    },
    {
        href: "/volunteers",
        label: "Volunteers",
        roles: ["admin", "volunteer_coordinator"],
        icon: Users,
    },
];

const roleLabels: Record<Role, string> = {
    admin: "Admin",
    ops_manager: "Operations Manager",
    sustainability_lead: "Sustainability Lead",
    volunteer_coordinator: "Volunteer Coordinator",
};

export default function RoleNav({ role }: { role: Role }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const visibleItems = navItems.filter((item) => item.roles.includes(role));

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/login");
    }

    return (
        <aside className="flex h-full flex-col border-r border-border/80 bg-[#0a0f14]/95 px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen">
            <div className="mb-8 flex items-center gap-3 px-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent shadow-[0_0_24px_rgba(61,214,196,0.08)]">
                    <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
                        StadiumPulse AI
                    </p>
                    <h1 className="text-lg font-semibold tracking-tight text-[#edeff2]">
                        PulseOps
                    </h1>
                </div>
            </div>

            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Workspace</p>
            <nav aria-label="Dashboard navigation" className="space-y-1.5">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`group flex h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${isActive
                                ? "border-accent/25 bg-accent/10 text-accent shadow-[inset_3px_0_0_#3dd6c4]"
                                : "border-transparent text-text-muted hover:border-border hover:bg-surface hover:text-foreground"
                                }`}
                        >
                            <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto rounded-2xl border border-border bg-surface/80 p-4">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-ok opacity-40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-status-ok" />
                    </span>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                        Demo environment
                    </p>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{roleLabels[role]}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">Simulated telemetry · Human-controlled actions</p>
            </div>

            <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent text-sm font-medium text-text-muted transition hover:border-accent/50 hover:bg-accent/5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
            </button>
        </aside>
    );
}

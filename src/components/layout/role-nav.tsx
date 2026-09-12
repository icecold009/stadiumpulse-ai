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
import type { AccessibleVenue } from "@/lib/auth/venue-scope-policy";
import VenueScopeSelector from "@/components/layout/venue-scope-selector";
import ThemeToggle from "@/components/theme/theme-toggle";

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

export default function RoleNav({ role, venues, unresolvedAlertCount = 0 }: { role: Role; venues: AccessibleVenue[]; unresolvedAlertCount?: number }) {
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
        <aside className="sticky top-0 z-30 flex h-auto flex-col border-b border-border bg-surface-muted/95 px-4 py-4 backdrop-blur-sm lg:sticky lg:h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
            <div className="mb-5 flex items-center justify-between gap-3 px-1 lg:mb-10">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-strong/50 bg-accent-soft text-accent-strong">
                    <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">StadiumPulse AI</p>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-foreground">PulseOps</p>
                    </div>
                </div>
                <div className="lg:hidden"><ThemeToggle compact /></div>
            </div>

            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-subtle">Workspace</p>
            <nav aria-label="Dashboard navigation" className="flex gap-1.5 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/ops"
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`control group flex min-h-11 shrink-0 items-center gap-3 rounded-[10px] border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong/60 lg:w-full ${isActive
                                ? "border-accent-strong/35 bg-accent-soft text-accent-strong lg:shadow-[inset_3px_0_0_var(--accent-strong)]"
                                : "border-transparent text-text-muted hover:border-border hover:bg-surface hover:text-foreground"
                                }`}
                        >
                            <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                            <span className="truncate">{item.label}</span>
                            {item.href === "/ops/alerts" && unresolvedAlertCount > 0 ? (
                                <span className="mono-data ml-auto inline-flex min-w-6 items-center justify-center rounded-full border border-status-critical/45 bg-status-critical/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-critical">
                                    <span className="sr-only">{unresolvedAlertCount} unresolved alerts</span>
                                    {unresolvedAlertCount > 99 ? "99+" : unresolvedAlertCount}
                                </span>
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-3 border-t border-border pt-3 lg:hidden">
                <VenueScopeSelector role={role} venues={venues} />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface p-4 lg:mt-auto">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-status-ok" />
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-subtle">
                        Demo environment
                    </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{roleLabels[role]}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">Simulated telemetry · Human-controlled actions</p>
            </div>

            <div className="mt-3 hidden lg:block"><ThemeToggle /></div>
            <button
                type="button"
                onClick={handleSignOut}
                className="control button-secondary mt-3 w-full text-text-muted"
            >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
            </button>
        </aside>
    );
}

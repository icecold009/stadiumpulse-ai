"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Role =
    | "admin"
    | "ops_manager"
    | "sustainability_lead"
    | "volunteer_coordinator";

type NavItem = {
    href: string;
    label: string;
    roles: Role[];
};

const navItems: NavItem[] = [
    {
        href: "/overview",
        label: "Overview",
        roles: ["admin", "ops_manager", "sustainability_lead", "volunteer_coordinator"],
    },
    {
        href: "/ops",
        label: "Ops",
        roles: ["admin", "ops_manager"],
    },
    {
        href: "/sustainability",
        label: "Sustainability",
        roles: ["admin", "sustainability_lead"],
    },
    {
        href: "/volunteers",
        label: "Volunteers",
        roles: ["admin", "volunteer_coordinator"],
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
        <aside className="flex h-full flex-col border-r border-[#26303a] bg-[#0b0f14]/95 px-5 py-6 backdrop-blur-sm">
            <div className="mb-8 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#3dd6c4]">
                    StadiumPulse AI
                </p>
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-[#edeff2]">
                        Command Center
                    </h1>
                    <p className="text-sm text-[#8b96a3]">{roleLabels[role]}</p>
                </div>
            </div>

            <nav aria-label="Dashboard navigation" className="space-y-2">
                {visibleItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex h-11 items-center rounded-xl border border-transparent px-4 text-sm font-medium text-[#edeff2] transition hover:border-[#26303a] hover:bg-[#141a21] hover:text-[#3dd6c4] focus-visible:border-[#3dd6c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3dd6c4]/30"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto rounded-xl border border-[#26303a] bg-[#141a21] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8b96a3]">
                    Live shell
                </p>
                <p className="mt-2 text-sm leading-6 text-[#edeff2]">
                    Metrics, alerts, and AI guidance stay visible while you move between dashboard views.
                </p>
            </div>

            <button
                onClick={handleSignOut}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-[#26303a] bg-transparent text-sm font-medium text-[#8b96a3] transition hover:border-[#3dd6c4] hover:text-[#3dd6c4]"
            >
                Sign out
            </button>
        </aside>
    );
}
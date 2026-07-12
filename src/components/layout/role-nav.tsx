import Link from "next/link";

type Role =
    | "admin"
    | "ops_manager"
    | "sustainability_lead"
    | "volunteer_coordinator";

type NavItem = {
    href: string;
    label: string;
    role: Role;
};

const navItems: NavItem[] = [
    { href: "/overview", label: "Overview", role: "admin" },
    { href: "/ops", label: "Ops", role: "ops_manager" },
    {
        href: "/sustainability",
        label: "Sustainability",
        role: "sustainability_lead",
    },
    {
        href: "/volunteers",
        label: "Volunteers",
        role: "volunteer_coordinator",
    },
];

const roleLabels: Record<Role, string> = {
    admin: "Admin",
    ops_manager: "Operations Manager",
    sustainability_lead: "Sustainability Lead",
    volunteer_coordinator: "Volunteer Coordinator",
};

export default function RoleNav({ role }: { role: Role }) {
    const visibleItems = role === "admin" ? navItems : navItems.filter((item) => item.role === role);

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
        </aside>
    );
}

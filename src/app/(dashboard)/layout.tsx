import { redirect } from "next/navigation";
import RoleNav from "@/components/layout/role-nav";
import { DashboardPoller } from "@/components/dashboard-poller";
import CopilotPanel from "@/components/copilot/copilot-panel";
import OperatorContextBanner from "@/components/layout/operator-context-banner";
import VenueScopeSelector from "@/components/layout/venue-scope-selector";
import DashboardKeyboardShortcuts from "@/components/layout/dashboard-keyboard-shortcuts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole } from "@/lib/auth/roles";
import { resolveVenueScope } from "@/lib/auth/venue-scope";

export default async function DashboardLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!isRole(roleRow?.role)) redirect("/unauthorized");
    const role = roleRow.role;
    const venueScope = await resolveVenueScope();
    if (!venueScope.ok) {
        if (venueScope.status === 401) redirect("/login");
        return (
            <main className="min-h-screen bg-background p-8 text-foreground">
                <h1 className="text-xl font-semibold">Venue access unavailable</h1>
                <p className="mt-2 text-sm text-text-muted">{venueScope.error}</p>
            </main>
        );
    }

    const alertCountResult = role === "admin" || role === "ops_manager"
        ? await supabase
            .from("alerts")
            .select("id", { count: "exact", head: true })
            .in("venue_id", venueScope.scope.queryVenueIds)
            .eq("status", "open")
        : null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <DashboardKeyboardShortcuts />
            <a
                href="#main-content"
                className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-[10px] bg-accent px-4 py-2 font-semibold text-background transition-transform duration-150 focus:translate-y-0"
            >
                Skip to main content
            </a>
            <div className="mx-auto grid min-h-screen w-full max-w-[1680px] lg:grid-cols-[248px_minmax(0,1fr)]">
                <RoleNav role={role} venues={venueScope.scope.venues} unresolvedAlertCount={alertCountResult?.count ?? 0} />
                <DashboardPoller role={role} />
                <main id="main-content" tabIndex={-1} className="min-w-0 px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
                    <OperatorContextBanner />
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                            <span className="font-bold uppercase tracking-[0.14em] text-foreground">Current scope</span>
                            <span>Simulated telemetry · authenticated venue access</span>
                            <span className="hidden text-text-subtle sm:inline">A alerts · R refresh · C Copilot · M main</span>
                        </div>
                        <div className="hidden lg:block">
                            <VenueScopeSelector role={role} venues={venueScope.scope.venues} />
                        </div>
                    </div>
                    {children}
                </main>
            </div>

            <CopilotPanel />
        </div>
    );
}

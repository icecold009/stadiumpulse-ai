import { redirect } from "next/navigation";
import RoleNav from "@/components/layout/role-nav";
import { DashboardPoller } from "@/components/dashboard-poller";
import CopilotPanel from "@/components/copilot/copilot-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole } from "@/lib/auth/roles";

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

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(61,214,196,0.1),transparent_30%),linear-gradient(180deg,#0b0f14_0%,#091015_100%)] text-[#edeff2]">
            <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
                <RoleNav role={role} />
                <DashboardPoller />
                <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
                    <div className="rounded-3xl border border-[#26303a] bg-[#141a21]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>

            <CopilotPanel />
        </div>
    );
}

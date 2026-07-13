// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import RoleNav from "@/components/layout/role-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Role = "admin" | "ops_manager" | "sustainability_lead" | "volunteer_coordinator";

export default async function DashboardLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const role = (user.user_metadata?.role ?? "admin") as Role;

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(61,214,196,0.1),transparent_30%),linear-gradient(180deg,#0b0f14_0%,#091015_100%)] text-[#edeff2]">
            <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
                <RoleNav role={role} />
                <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
                    <div className="rounded-3xl border border-[#26303a] bg-[#141a21]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
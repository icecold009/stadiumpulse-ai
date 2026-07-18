"use client";

import { useSimulatePoll } from "@/hooks/useSimulatePoll";
import type { Role } from "@/lib/auth/roles";

export function DashboardPoller({ role }: { role: Role }) {
    useSimulatePoll(role === "admin" || role === "ops_manager" ? 30_000 : 0);
    return null;
}

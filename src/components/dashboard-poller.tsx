"use client";

import { useSimulatePoll } from "@/hooks/useSimulatePoll";

export function DashboardPoller() {
    useSimulatePoll(30_000);
    return null;
}
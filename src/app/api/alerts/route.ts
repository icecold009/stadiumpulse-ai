// src/app/api/alerts/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole } from "@/lib/auth/roles";

export async function GET() {
    const db = await createSupabaseServerClient();
    const {
        data: { user },
    } = await db.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: roleRow } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        !isRole(roleRow?.role) ||
        !["admin", "ops_manager"].includes(roleRow.role)
    ) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data, error } = await db
        .from("alerts")
        .select("*, zones(label, capacity)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alerts: data });
}

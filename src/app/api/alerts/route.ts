// src/app/api/alerts/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
    const db = await createSupabaseServerClient();

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
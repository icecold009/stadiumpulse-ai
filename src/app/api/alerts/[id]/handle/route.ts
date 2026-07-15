import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AlertsUpdate = Database["public"]["Tables"]["alerts"]["Update"];

export async function PATCH(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const db = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await db.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: AlertsUpdate = {
        status: "handled",
        handled_by: user.id,
        handled_at: new Date().toISOString(),
    };

    const query = db.from("alerts");

    const { data, error } = await query
        .update(payload)
        .eq("id", id)
        .eq("status", "open")
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ alert: data });
}
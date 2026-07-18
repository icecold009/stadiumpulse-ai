import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAlertAction, UUID_PATTERN } from "@/lib/api/contracts";
import type { Database } from "@/types/database";

type AlertsUpdate = Database["public"]["Tables"]["alerts"]["Update"];

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
        return NextResponse.json({ error: "Invalid alert id." }, { status: 400 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsedAction = parseAlertAction(body);
    if (!parsedAction.ok) {
        return NextResponse.json(
            { error: parsedAction.error },
            { status: 400 }
        );
    }
    const action = parsedAction.value;
    const db = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await db.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();
    const payload: AlertsUpdate =
        action === "handled"
            ? { status: "handled", handled_by: user.id, handled_at: now }
            : {
                  operator_decision: action === "accept" ? "accepted" : "rejected",
                  decision_by: user.id,
                  decision_at: now,
              };

    const query = db.from("alerts");

    const { data, error } = await query
        .update(payload)
        .eq("id", id)
        .eq("status", "open")
        .select()
        .single();

    if (error) {
        console.error("[alerts] operator feedback update failed", {
            alertId: id,
            userId: user.id,
            message: error.message,
        });
        return NextResponse.json(
            { error: "Alert feedback could not be recorded." },
            { status: 403 }
        );
    }

    return NextResponse.json({ alert: data });
}

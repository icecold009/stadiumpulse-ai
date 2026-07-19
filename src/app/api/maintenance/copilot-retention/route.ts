import { NextResponse } from "next/server";
import {
    COPILOT_QUERY_RETENTION_HOURS,
    copilotRetentionCutoff,
} from "@/lib/maintenance/retention-policy";
import { authorizeSystemRoute } from "@/lib/security/system-route-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

async function purgeCopilotQueries(request: Request) {
    const authorization = await authorizeSystemRoute(request, ["admin"]);
    if (!authorization.ok) {
        return NextResponse.json(
            { error: authorization.error },
            { status: authorization.status }
        );
    }

    const cutoff = copilotRetentionCutoff();
    const db = createSupabaseServiceRoleClient();
    const { data, error } = await db
        .from("copilot_queries")
        .delete()
        .lt("created_at", cutoff)
        .select("id");

    if (error) {
        console.error("[copilot-retention] purge failed", {
            subject: authorization.caller.subject,
            message: error.message,
        });
        return NextResponse.json(
            { error: "Copilot retention maintenance failed safely." },
            { status: 500 }
        );
    }

    return NextResponse.json({
        ok: true,
        deleted: data?.length ?? 0,
        retentionHours: COPILOT_QUERY_RETENTION_HOURS,
        cutoff,
    });
}

// Vercel Cron invokes GET. POST supports an authenticated Admin verification run.
export async function GET(request: Request) {
    return purgeCopilotQueries(request);
}

export async function POST(request: Request) {
    return purgeCopilotQueries(request);
}

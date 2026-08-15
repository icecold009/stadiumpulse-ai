import "server-only";

import { NextResponse } from "next/server";
import { authorizeSystemRoute } from "@/lib/security/system-route-auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { logServerError, logServerEvent, requestIdFrom } from "@/lib/observability/safe-log";

export const runtime = "nodejs";

const ROLLUP_AFTER_HOURS = 24;
const RAW_RETENTION_DAYS = 30;
const ROLLUP_RETENTION_DAYS = 90;

async function runTelemetryMaintenance(request: Request) {
    const requestId = requestIdFrom(request);
    const authorization = await authorizeSystemRoute(request, ["admin"]);
    if (!authorization.ok) {
        return NextResponse.json(
            { error: authorization.error },
            { status: authorization.status }
        );
    }

    const now = Date.now();
    const rollupBefore = new Date(now - ROLLUP_AFTER_HOURS * 60 * 60 * 1000).toISOString();
    const rawRetentionCutoff = new Date(now - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const rollupRetentionCutoff = new Date(now - ROLLUP_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const db = createSupabaseServiceRoleClient();
    const { data, error } = await db.rpc("rollup_telemetry", {
        p_rollup_before: rollupBefore,
        p_raw_retention_cutoff: rawRetentionCutoff,
        p_rollup_retention_cutoff: rollupRetentionCutoff,
    });

    if (error) {
        logServerError("telemetry_rollup_failed", { requestId, subject: authorization.caller.subject, message: error.message, status: 500 });
        return NextResponse.json(
            { error: "Telemetry maintenance failed safely." },
            { status: 500 }
        );
    }

    logServerEvent("telemetry_rollup_completed", { requestId, subject: authorization.caller.subject, status: 200 });

    return NextResponse.json({
        ok: true,
        rollupBefore,
        rawRetentionCutoff,
        rollupRetentionCutoff,
        result: data,
    });
}

export async function GET(request: Request) {
    return runTelemetryMaintenance(request);
}

export async function POST(request: Request) {
    return runTelemetryMaintenance(request);
}

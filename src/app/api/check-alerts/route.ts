import "server-only";

import { NextResponse } from "next/server";
import { checkAndCreateAlerts } from "@/lib/alerts/check-alerts";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { authorizeSystemRoute } from "@/lib/security/system-route-auth";

async function handleCheck(request: Request) {
    const authorization = await authorizeSystemRoute(request);
    if (!authorization.ok) {
        return NextResponse.json(
            { error: authorization.error },
            { status: authorization.status }
        );
    }

    const allowed = await consumeRateLimit({
        subject: authorization.caller.subject,
        action: "check-alerts",
        limit: authorization.caller.kind === "cron" ? 2 : 4,
        windowSeconds: 60,
    });
    if (!allowed) {
        return NextResponse.json(
            { error: "Alert checks are temporarily limited. Try again shortly." },
            { status: 429 }
        );
    }

    try {
        return NextResponse.json(await checkAndCreateAlerts());
    } catch (error) {
        console.error("[check-alerts] failed", {
            message: error instanceof Error ? error.message : "Unknown error",
        });
        return NextResponse.json(
            { error: "Alert detection failed." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    return handleCheck(request);
}

export async function GET(request: Request) {
    return handleCheck(request);
}

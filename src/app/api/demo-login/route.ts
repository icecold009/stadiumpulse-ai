import "server-only";

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { defaultRouteForRole, isRole, type Role } from "@/lib/auth/roles";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const EMAIL_VARIABLES: Record<Role, string> = {
    admin: "DEMO_ADMIN_EMAIL",
    ops_manager: "DEMO_OPS_MANAGER_EMAIL",
    sustainability_lead: "DEMO_SUSTAINABILITY_LEAD_EMAIL",
    volunteer_coordinator: "DEMO_VOLUNTEER_COORDINATOR_EMAIL",
};

function requestSubject(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const address = forwarded || request.headers.get("x-real-ip") || "unknown";
    return createHash("sha256").update(`demo-login:${address}`).digest("hex");
}

export async function POST(request: NextRequest) {
    if (process.env.DEMO_ACCESS_ENABLED !== "true") {
        return NextResponse.json({ error: "Demo access is disabled." }, { status: 404 });
    }

    let role: unknown;
    try {
        ({ role } = (await request.json()) as { role?: unknown });
    } catch {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (!isRole(role)) {
        return NextResponse.json({ error: "Invalid demo role." }, { status: 400 });
    }

    const allowed = await consumeRateLimit({
        subject: requestSubject(request),
        action: "demo_login",
        limit: 8,
        windowSeconds: 60,
    });
    if (!allowed) {
        return NextResponse.json({ error: "Too many demo sign-ins. Try again shortly." }, { status: 429 });
    }

    const email = process.env[EMAIL_VARIABLES[role]];
    if (!email) {
        return NextResponse.json({ error: "This demo role is not configured." }, { status: 503 });
    }

    const service = createSupabaseServiceRoleClient();
    const { data: link, error: linkError } = await service.auth.admin.generateLink({
        type: "magiclink",
        email,
    });
    if (linkError || !link.properties?.hashed_token || !link.user) {
        console.error("[demo-login] could not create demo session", { role });
        return NextResponse.json({ error: "Demo access is unavailable." }, { status: 503 });
    }

    const { data: roleRow, error: roleError } = await service
        .from("user_roles")
        .select("role")
        .eq("user_id", link.user.id)
        .maybeSingle();
    if (roleError || roleRow?.role !== role) {
        console.error("[demo-login] configured account role mismatch", { role });
        return NextResponse.json({ error: "This demo role is not configured." }, { status: 503 });
    }

    const sessionClient = await createSupabaseServerClient();
    const { error: verifyError } = await sessionClient.auth.verifyOtp({
        type: "magiclink",
        token_hash: link.properties.hashed_token,
    });
    if (verifyError) {
        console.error("[demo-login] session verification failed", { role });
        return NextResponse.json({ error: "Demo access is unavailable." }, { status: 503 });
    }

    return NextResponse.json(
        { redirectTo: defaultRouteForRole(role) },
        { headers: { "Cache-Control": "no-store" } }
    );
}

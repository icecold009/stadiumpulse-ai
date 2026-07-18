import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole, type Role } from "@/lib/auth/roles";

type AuthorizedCaller =
    | { kind: "cron"; subject: "cron" }
    | { kind: "user"; subject: string; role: Role };

type AuthorizationResult =
    | { ok: true; caller: AuthorizedCaller }
    | { ok: false; status: 401 | 403; error: string };

function hasCronSecret(request: Request): boolean {
    const configuredSecret = process.env.CRON_SECRET;
    if (!configuredSecret) return false;

    const authorization = request.headers.get("authorization");
    return authorization === `Bearer ${configuredSecret}`;
}

export async function authorizeSystemRoute(
    request: Request,
    allowedRoles: Role[] = ["admin", "ops_manager"]
): Promise<AuthorizationResult> {
    if (hasCronSecret(request)) {
        return { ok: true, caller: { kind: "cron", subject: "cron" } };
    }

    const db = await createSupabaseServerClient();
    const {
        data: { user },
        error: authError,
    } = await db.auth.getUser();

    if (authError || !user) {
        return { ok: false, status: 401, error: "Unauthorized." };
    }

    const { data: roleRow } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!isRole(roleRow?.role) || !allowedRoles.includes(roleRow.role)) {
        return { ok: false, status: 403, error: "Forbidden." };
    }

    return {
        ok: true,
        caller: { kind: "user", subject: user.id, role: roleRow.role },
    };
}

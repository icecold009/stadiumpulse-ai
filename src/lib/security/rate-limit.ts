import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type RateLimitOptions = {
    subject: string;
    action: string;
    limit: number;
    windowSeconds: number;
};

export async function consumeRateLimit({
    subject,
    action,
    limit,
    windowSeconds,
}: RateLimitOptions): Promise<boolean> {
    const db = createSupabaseServiceRoleClient();
    const { data, error } = await db.rpc("consume_rate_limit", {
        p_subject: subject,
        p_action: action,
        p_limit: limit,
        p_window_seconds: windowSeconds,
    });

    if (error) {
        console.error("[rate-limit] check failed", { action, message: error.message });
        return false;
    }

    return data === true;
}

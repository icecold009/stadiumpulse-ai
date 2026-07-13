// src/lib/supabase/service-role.ts
// PRIVILEGED CLIENT — bypasses RLS.
// Use ONLY in server-side system routes (simulate-tick, check-alerts, copilot logging).
// NEVER import this in client components or expose to the browser.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseServiceRoleClient() {
    if (client) return client; // singleton — reuse across requests in the same process

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. " +
            "Check your .env.local file."
        );
    }

    client = createClient<Database>(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return client;
}
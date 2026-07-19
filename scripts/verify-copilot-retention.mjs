import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const appUrl = process.env.PULSEOPS_APP_URL?.replace(/\/$/, "");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;
const missing = Object.entries({ PULSEOPS_APP_URL: appUrl, NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey, CRON_SECRET: cronSecret })
    .filter(([, value]) => !value)
    .map(([name]) => name);
if (missing.length) throw new Error(`Retention verification is missing: ${missing.join(", ")}.`);

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const service = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const { data: adminRole, error: roleError } = await service
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .single();
if (roleError) throw roleError;

const marker = `retention-${Date.now()}`;
const oldQuestion = `${marker}-old`;
const recentQuestion = `${marker}-recent`;
const rows = [
    {
        user_id: adminRole.user_id,
        question: oldQuestion,
        grounded_data_summary: "Retention verification row.",
        answer: "Retention verification row.",
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1_000).toISOString(),
    },
    {
        user_id: adminRole.user_id,
        question: recentQuestion,
        grounded_data_summary: "Retention verification row.",
        answer: "Retention verification row.",
        created_at: new Date().toISOString(),
    },
];
const { data: inserted, error: insertError } = await service
    .from("copilot_queries")
    .insert(rows)
    .select("id, question");
if (insertError) throw insertError;

try {
    const unauthorized = await fetch(`${appUrl}/api/maintenance/copilot-retention`);
    assert(unauthorized.status === 401, `Unauthenticated retention returned ${unauthorized.status}.`);

    const authorized = await fetch(`${appUrl}/api/maintenance/copilot-retention`, {
        headers: { authorization: `Bearer ${cronSecret}` },
    });
    const result = await authorized.json();
    assert(authorized.ok && result.ok === true, `Authorized retention returned ${authorized.status}.`);
    assert(result.retentionHours === 24, "Retention route reported the wrong policy window.");

    const { data: remaining, error } = await service
        .from("copilot_queries")
        .select("question")
        .in("id", inserted.map((row) => row.id));
    if (error) throw error;
    assert(!(remaining ?? []).some((row) => row.question === oldQuestion), "Expired Copilot query was not deleted.");
    assert((remaining ?? []).some((row) => row.question === recentQuestion), "Recent Copilot query was deleted.");

    console.log(JSON.stringify({ ok: true, unauthorized: 401, expiredDeleted: true, recentPreserved: true }));
} finally {
    await service.from("copilot_queries").delete().in("id", inserted.map((row) => row.id));
}

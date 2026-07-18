import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Missing required Supabase environment variables.");
}

const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const { data: roleRows, error: roleError } = await admin
    .from("user_roles")
    .select("user_id, role");
if (roleError) throw new Error(`Could not load roles: ${roleError.message}`);

const { data: usersPage, error: usersError } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
if (usersError) throw new Error(`Could not load Auth users: ${usersError.message}`);

const usersById = new Map(usersPage.users.map((user) => [user.id, user]));
const tablesByRole = {
    admin: ["venues", "zones", "zone_telemetry", "sustainability_metrics", "volunteers", "alerts", "user_venue_access"],
    ops_manager: ["venues", "zones", "zone_telemetry", "gates", "gate_scans", "alerts", "user_venue_access"],
    sustainability_lead: ["venues", "sustainability_metrics", "user_venue_access"],
    volunteer_coordinator: ["zones", "volunteers", "user_venue_access"],
};

const results = [];

for (const roleRow of roleRows ?? []) {
    const user = usersById.get(roleRow.user_id);
    const expectedTables = tablesByRole[roleRow.role];

    if (!user?.email || !expectedTables) {
        results.push({ role: roleRow.role, ok: false, error: "Missing user email or unknown role." });
        continue;
    }

    const { data: linkData, error: linkError } =
        await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
    if (linkError || !linkData.properties?.hashed_token) {
        results.push({ role: roleRow.role, ok: false, error: linkError?.message ?? "No test token returned." });
        continue;
    }

    const client = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: sessionError } = await client.auth.verifyOtp({
        type: "magiclink",
        token_hash: linkData.properties.hashed_token,
    });

    if (sessionError) {
        results.push({ role: roleRow.role, ok: false, error: sessionError.message });
        continue;
    }

    const tableResults = {};
    for (const table of expectedTables) {
        const { count, error } = await client
            .from(table)
            .select("*", { count: "exact", head: true });
        tableResults[table] = error
            ? { ok: false, error: error.message }
            : { ok: true, count: count ?? 0 };
    }

    results.push({
        role: roleRow.role,
        ok: Object.values(tableResults).every((result) => result.ok),
        tables: tableResults,
    });

    await client.auth.signOut();
}

console.log(JSON.stringify({ ok: results.every((result) => result.ok), results }, null, 2));

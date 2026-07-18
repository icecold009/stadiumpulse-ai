import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;
const appUrl = process.env.PULSEOPS_APP_URL?.replace(/\/$/, "");

const missingVariables = [
    ["NEXT_PUBLIC_SUPABASE_URL", url],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
    ["CRON_SECRET", cronSecret],
].filter(([, value]) => !value).map(([name]) => name);

if (missingVariables.length > 0) {
    throw new Error(
        `Hosted P0 verification is missing: ${missingVariables.join(", ")}. Set PULSEOPS_APP_URL to include deployed route verification.`
    );
}

const service = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function roleClients() {
    const { data: roles, error: rolesError } = await service
        .from("user_roles")
        .select("user_id, role");
    if (rolesError) throw rolesError;

    const { data: usersPage, error: usersError } =
        await service.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (usersError) throw usersError;
    const users = new Map(usersPage.users.map((user) => [user.id, user]));
    const clients = new Map();

    for (const row of roles ?? []) {
        const user = users.get(row.user_id);
        if (!user?.email) continue;
        const { data: link, error: linkError } =
            await service.auth.admin.generateLink({ type: "magiclink", email: user.email });
        if (linkError || !link.properties?.hashed_token) throw linkError ?? new Error("No role test token.");

        const client = createClient(url, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        const { error } = await client.auth.verifyOtp({
            type: "magiclink",
            token_hash: link.properties.hashed_token,
        });
        if (error) throw error;
        clients.set(row.role, { client, userId: row.user_id });
    }

    return clients;
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const clients = await roleClients();
for (const role of ["admin", "ops_manager", "sustainability_lead", "volunteer_coordinator"]) {
    assert(clients.has(role), `Missing live ${role} test account.`);
}

const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const { data: anonymousVenues, error: anonymousError } = await anon
    .from("venues")
    .select("id")
    .limit(1);
assert(Boolean(anonymousError) || (anonymousVenues ?? []).length === 0, "Anonymous venue read was not denied.");

const { data: anonymousAccess, error: anonymousAccessError } = await anon
    .from("user_venue_access")
    .select("user_id")
    .limit(1);
assert(
    Boolean(anonymousAccessError) || (anonymousAccess ?? []).length === 0,
    "Anonymous venue-access read was not denied."
);

for (const role of ["ops_manager", "sustainability_lead", "volunteer_coordinator"]) {
    const { data, error } = await clients
        .get(role)
        .client.from("user_venue_access")
        .select("user_id, venue_id");
    assert(!error && (data ?? []).length > 0, `${role} has no readable venue assignment.`);
    assert(
        data.every((row) => row.user_id === clients.get(role).userId),
        `${role} could read another user's venue assignment.`
    );
}

const { data: alert } = await service.from("alerts").select("id, status").limit(1).maybeSingle();
const { data: volunteer } = await service.from("volunteers").select("id, status").limit(1).maybeSingle();
assert(alert && volunteer, "Live alert and volunteer rows are required for write-policy verification.");

for (const role of ["sustainability_lead", "volunteer_coordinator"]) {
    const { data, error } = await clients
        .get(role)
        .client.from("alerts")
        .update({ status: alert.status })
        .eq("id", alert.id)
        .select("id");
    assert(!error && (data ?? []).length === 0, `${role} could update alerts.`);
}

for (const role of ["ops_manager", "sustainability_lead"]) {
    const { data, error } = await clients
        .get(role)
        .client.from("volunteers")
        .update({ status: volunteer.status })
        .eq("id", volunteer.id)
        .select("id");
    assert(!error && (data ?? []).length === 0, `${role} could update volunteers.`);
}

const { data: adminAlertWrite, error: adminAlertError } = await clients
    .get("admin")
    .client.from("alerts")
    .update({ status: alert.status })
    .eq("id", alert.id)
    .select("id");
assert(!adminAlertError && adminAlertWrite?.length === 1, "Admin alert update was denied.");

const { data: coordinatorWrite, error: coordinatorError } = await clients
    .get("volunteer_coordinator")
    .client.from("volunteers")
    .update({ status: volunteer.status })
    .eq("id", volunteer.id)
    .select("id");
assert(!coordinatorError && coordinatorWrite?.length === 1, "Coordinator volunteer update was denied.");

const queryMarker = `p0-isolation-${Date.now()}`;
const queryRows = [
    {
        user_id: clients.get("admin").userId,
        question: `${queryMarker}-admin`,
        grounded_data_summary: "verification row",
        answer: "verification row",
    },
    {
        user_id: clients.get("ops_manager").userId,
        question: `${queryMarker}-ops`,
        grounded_data_summary: "verification row",
        answer: "verification row",
    },
];
const { data: insertedQueries, error: queryInsertError } = await service
    .from("copilot_queries")
    .insert(queryRows)
    .select("id, user_id");
if (queryInsertError) throw queryInsertError;
try {
    const ids = insertedQueries.map((row) => row.id);
    for (const role of ["admin", "ops_manager"]) {
        const { data, error } = await clients
            .get(role)
            .client.from("copilot_queries")
            .select("id, user_id")
            .in("id", ids);
        assert(!error && data?.length === 1, `${role} did not see exactly one own query.`);
        assert(data[0].user_id === clients.get(role).userId, `${role} could read another user's query.`);
    }
} finally {
    await service
        .from("copilot_queries")
        .delete()
        .in("id", insertedQueries.map((row) => row.id));
}

const limiterSubject = `verification-${Date.now()}`;
try {
    for (const expected of [true, true, false]) {
        const { data, error } = await service.rpc("consume_rate_limit", {
            p_subject: limiterSubject,
            p_action: "verification",
            p_limit: 2,
            p_window_seconds: 60,
        });
        if (error) throw error;
        assert(data === expected, "Atomic rate limiter returned an unexpected result.");
    }
} finally {
    await service.from("rate_limits").delete().eq("subject", limiterSubject);
}

const { data: zone } = await service.from("zones").select("id, capacity").limit(1).single();
let realtimeRowId;
const opsClient = clients.get("ops_manager").client;
try {
    const realtime = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Realtime telemetry event timed out.")), 15_000);
        const channel = opsClient
            .channel(`p0-verification-${Date.now()}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "zone_telemetry", filter: `zone_id=eq.${zone.id}` },
                (payload) => {
                    clearTimeout(timer);
                    resolve({ channel, payload });
                }
            )
            .subscribe(async (status) => {
                if (status !== "SUBSCRIBED") return;
                const { data, error } = await service
                    .from("zone_telemetry")
                    .insert({ zone_id: zone.id, occupancy: Math.min(zone.capacity, 1), recorded_at: new Date().toISOString() })
                    .select("id")
                    .single();
                if (error) reject(error);
                realtimeRowId = data?.id;
            });
    });
    const { channel } = await realtime;
    await opsClient.removeChannel(channel);
} finally {
    if (realtimeRowId) await service.from("zone_telemetry").delete().eq("id", realtimeRowId);
}

let routeVerification = "skipped: set PULSEOPS_APP_URL";
if (appUrl) {
    const unauthorized = await fetch(`${appUrl}/api/simulate-tick`, { method: "POST" });
    assert(unauthorized.status === 401, `Unauthenticated simulation returned ${unauthorized.status}, expected 401.`);

    const authorized = await fetch(`${appUrl}/api/simulate-tick`, {
        method: "POST",
        headers: { authorization: `Bearer ${cronSecret}` },
    });
    const payload = await authorized.json();
    assert(authorized.ok && payload.ok === true, `Authorized simulation failed with ${authorized.status}.`);
    assert(payload.inserted?.zone_telemetry > 0, "Authorized simulation inserted no telemetry.");
    routeVerification = "passed";
}

for (const { client } of clients.values()) await client.auth.signOut();

console.log(
    JSON.stringify({
        ok: true,
        anonymous_read_denied: true,
        venue_access_isolation: true,
        cross_role_writes_denied: true,
        authorized_writes_allowed: true,
        copilot_query_isolation: true,
        durable_rate_limit: true,
        realtime_delivery: true,
        deployed_route_verification: routeVerification,
    })
);

import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = process.env.PULSEOPS_APP_URL?.replace(/\/$/, "");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const skipAdvisors = process.env.PULSEOPS_SKIP_ADVISORS === "true";
const required = { PULSEOPS_APP_URL: baseUrl, NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey };
const missing = Object.entries(required).filter(([, value]) => !value).map(([name]) => name);
if (missing.length) throw new Error(`Hosted P1 verification is missing: ${missing.join(", ")}.`);

const service = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const roles = ["admin", "ops_manager", "sustainability_lead", "volunteer_coordinator"];

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function cookieHeader(response) {
    const values = response.headers.getSetCookie?.() ?? [];
    const raw = values.length ? values : [response.headers.get("set-cookie")].filter(Boolean);
    return raw.map((value) => value.split(";", 1)[0]).join("; ");
}

async function demoCookies() {
    const result = new Map();
    for (const role of roles) {
        const response = await fetch(`${baseUrl}/api/demo-login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ role }),
        });
        assert(response.ok, `${role} demo login returned ${response.status}.`);
        const cookie = cookieHeader(response);
        assert(cookie, `${role} demo login did not establish a session.`);
        result.set(role, cookie);
    }
    return result;
}

async function verifyJudgeButtons() {
    const response = await fetch(`${baseUrl}/login`);
    const html = await response.text();
    assert(response.ok, `Hosted login returned ${response.status}.`);
    for (const label of ["Admin", "Operations", "Sustainability", "Volunteers"]) {
        assert(html.includes(label), `Hosted login is missing the ${label} role button.`);
    }
}

async function authenticatedClients() {
    const { data: roleRows, error: roleError } = await service.from("user_roles").select("user_id, role");
    if (roleError) throw roleError;
    const { data: usersPage, error: usersError } = await service.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (usersError) throw usersError;
    const users = new Map(usersPage.users.map((user) => [user.id, user]));
    const result = new Map();

    for (const row of roleRows ?? []) {
        if (!roles.includes(row.role)) continue;
        const user = users.get(row.user_id);
        if (!user?.email) continue;
        const { data: link, error: linkError } = await service.auth.admin.generateLink({ type: "magiclink", email: user.email });
        if (linkError || !link.properties?.hashed_token) throw linkError ?? new Error(`No ${row.role} test token.`);
        const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
        const { error } = await client.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
        if (error) throw error;
        result.set(row.role, { client, userId: row.user_id });
    }
    for (const role of roles) assert(result.has(role), `Missing live ${role} account.`);
    return result;
}

async function call(path, cookie, method = "GET", body) {
    return fetch(`${baseUrl}${path}`, {
        method,
        headers: { cookie, ...(body === undefined ? {} : { "content-type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
    });
}

async function waitForChange(client, { table, event, predicate, trigger }) {
    const channel = client
        .channel(`p1_${table}_${randomUUID()}`)
        .on("postgres_changes", { event, schema: "public", table }, (payload) => {
            if (predicate(payload)) finish(null);
        });
    let settled = false;
    let timer;
    let finish;
    try {
        await new Promise((resolve, reject) => {
            finish = (error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (error) reject(error);
                else resolve();
            };
            timer = setTimeout(() => finish(new Error(`${table} ${event} Realtime event timed out.`)), 45_000);
            channel.subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    try { await trigger(); } catch (error) { finish(error); }
                } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    finish(new Error(`${table} Realtime subscription failed: ${status}.`));
                }
            });
        });
    } finally {
        await client.removeChannel(channel);
    }
}

function validateResourceAdvisor(payload) {
    assert(["ai", "fallback"].includes(payload?.source), "Resource advisor source is invalid.");
    assert(payload?.horizonMinutes === 15, "Resource advisor horizon is invalid.");
    assert(Array.isArray(payload?.recommendations), "Resource advisor recommendations are missing.");
    for (const item of payload.recommendations) {
        assert(item.zoneId && item.action && item.evidence && item.limitations, "Resource advisor output is not auditable.");
    }
}

function validateSustainabilityAdvisor(payload) {
    assert(["ai", "fallback"].includes(payload?.source), "Sustainability advisor source is invalid.");
    assert(Array.isArray(payload?.interventions), "Sustainability interventions are missing.");
    for (const item of payload.interventions) {
        assert(item.venueId && item.metricType && item.action && item.evidence && item.limitations, "Sustainability output is not auditable.");
    }
}

async function readCopilot(cookie, question) {
    const response = await call("/api/copilot", cookie, "POST", { question });
    assert(response.ok, `Copilot returned ${response.status}.`);
    const raw = await response.text();
    const events = raw.split("\n").filter((line) => line.startsWith("data: ")).map((line) => line.slice(6)).filter((line) => line !== "[DONE]").map((line) => JSON.parse(line));
    const error = events.find((event) => event.type === "error");
    assert(!error, `Copilot stream failed: ${error?.error ?? "unknown"}.`);
    const answer = events.filter((event) => event.type === "delta").map((event) => event.text).join("");
    assert(answer.trim(), "Copilot returned an empty answer.");
    return answer;
}

const clients = await authenticatedClients();
await verifyJudgeButtons();
const cookies = await demoCookies();
const results = { judgeAccess: { renderedButtons: 4, roleSessions: 4 }, advisors: {}, realtime: {}, volunteerReassignment: {}, incidentFeed: {}, copilotLogging: {} };

if (!skipAdvisors) {
    const simulation = await call("/api/simulate-tick", cookies.get("admin"), "POST", {});
    assert(simulation.ok, `P1 snapshot refresh returned ${simulation.status}.`);

    for (const role of roles) {
        const resource = await call("/api/resource-advisor", cookies.get(role));
        const expectedResource = role === "admin" || role === "ops_manager" ? 200 : 403;
        assert(resource.status === expectedResource, `${role} resource advisor returned ${resource.status}.`);
        if (resource.ok) validateResourceAdvisor(await resource.json());

        const sustainability = await call("/api/sustainability-advisor", cookies.get(role));
        const expectedSustainability = role === "admin" || role === "sustainability_lead" ? 200 : 403;
        assert(sustainability.status === expectedSustainability, `${role} sustainability advisor returned ${sustainability.status}.`);
        if (sustainability.ok) validateSustainabilityAdvisor(await sustainability.json());
    }
    results.advisors = { resourceRoles: ["admin", "ops_manager"], sustainabilityRoles: ["admin", "sustainability_lead"], crossRoleDenial: true };
} else {
    results.advisors = "skipped";
}

const { data: volunteer, error: volunteerError } = await service.from("volunteers").select("id, venue_id, zone_id, status").limit(1).single();
if (volunteerError) throw volunteerError;
const { data: destination, error: zoneError } = await service.from("zones").select("id").eq("venue_id", volunteer.venue_id).neq("id", volunteer.zone_id ?? randomUUID()).limit(1).single();
if (zoneError) throw zoneError;

for (const role of ["ops_manager", "sustainability_lead"]) {
    const denied = await call(`/api/volunteers/${volunteer.id}/reassign`, cookies.get(role), "PATCH", { zoneId: destination.id });
    assert(
        denied.status === 403 || denied.status === 404,
        `${role} volunteer reassignment returned ${denied.status}.`
    );
}

try {
    await waitForChange(clients.get("volunteer_coordinator").client, {
        table: "volunteers",
        event: "UPDATE",
        predicate: (payload) => payload.new?.id === volunteer.id,
        trigger: async () => {
            const response = await call(`/api/volunteers/${volunteer.id}/reassign`, cookies.get("admin"), "PATCH", { zoneId: destination.id });
            assert(response.ok, `Admin volunteer reassignment returned ${response.status}.`);
        },
    });
    const restore = await call(`/api/volunteers/${volunteer.id}/reassign`, cookies.get("volunteer_coordinator"), "PATCH", { zoneId: volunteer.zone_id });
    assert(restore.ok, `Coordinator volunteer restore returned ${restore.status}.`);
    results.volunteerReassignment = { admin: true, coordinator: true, crossRoleDenial: true, realtime: true, restored: true };
} catch (error) {
    await service.from("volunteers").update({ zone_id: volunteer.zone_id, status: volunteer.status }).eq("id", volunteer.id);
    throw error;
}

const { data: zone, error: referenceError } = await service.from("zones").select("id, venue_id, capacity").limit(1).single();
if (referenceError) throw referenceError;
const { data: gate, error: gateError } = await service.from("gates").select("id").eq("venue_id", zone.venue_id).limit(1).single();
if (gateError) throw gateError;
const realtimeMarker = new Date().toISOString();
const matchesRealtimeMarker = (value) =>
    typeof value === "string" && new Date(value).getTime() === new Date(realtimeMarker).getTime();
try {
    await waitForChange(clients.get("ops_manager").client, {
        table: "zone_telemetry", event: "INSERT",
        predicate: (payload) => matchesRealtimeMarker(payload.new?.recorded_at),
        trigger: async () => { const { error } = await service.from("zone_telemetry").insert({ zone_id: zone.id, occupancy: Math.min(1, zone.capacity), recorded_at: realtimeMarker }); if (error) throw error; },
    });
    await waitForChange(clients.get("ops_manager").client, {
        table: "gate_scans", event: "INSERT",
        predicate: (payload) => matchesRealtimeMarker(payload.new?.recorded_at),
        trigger: async () => { const { error } = await service.from("gate_scans").insert({ gate_id: gate.id, scan_count: 1, recorded_at: realtimeMarker }); if (error) throw error; },
    });
    await waitForChange(clients.get("sustainability_lead").client, {
        table: "sustainability_metrics", event: "INSERT",
        predicate: (payload) => matchesRealtimeMarker(payload.new?.recorded_at),
        trigger: async () => { const { error } = await service.from("sustainability_metrics").insert({ venue_id: zone.venue_id, metric_type: "energy_kwh", value: 1, target: 2, recorded_at: realtimeMarker }); if (error) throw error; },
    });
    results.realtime = { zoneTelemetry: true, gateScans: true, sustainability: true, volunteers: true };
} finally {
    await Promise.all([
        service.from("zone_telemetry").delete().eq("recorded_at", realtimeMarker),
        service.from("gate_scans").delete().eq("recorded_at", realtimeMarker),
        service.from("sustainability_metrics").delete().eq("recorded_at", realtimeMarker),
    ]);
}

const alertId = randomUUID();
try {
    await waitForChange(clients.get("ops_manager").client, {
        table: "alerts", event: "INSERT",
        predicate: (payload) => payload.new?.id === alertId,
        trigger: async () => {
            const { error } = await service.from("alerts").insert({
                id: alertId, venue_id: zone.venue_id, zone_id: zone.id, severity: "warn",
                message: "P1 incident-feed verification", ai_recommendation: "Observe only; verification row.",
                ai_urgency: "monitor", ai_evidence: "Synthetic verification row.",
                ai_limitations: "Not an operational incident.", ai_confidence: "low",
                recommendation_source: "fallback", snapshot_at: realtimeMarker, status: "open",
            });
            if (error) throw error;
        },
    });
    await waitForChange(clients.get("ops_manager").client, {
        table: "alerts", event: "UPDATE",
        predicate: (payload) => payload.new?.id === alertId && payload.new?.status === "handled",
        trigger: async () => {
            const response = await call(`/api/alerts/${alertId}/handle`, cookies.get("ops_manager"), "PATCH", { action: "handled" });
            assert(response.ok, `Ops incident handling returned ${response.status}.`);
        },
    });
    results.incidentFeed = { insertRealtime: true, handledRealtime: true };
} finally {
    await service.from("alerts").delete().eq("id", alertId);
}

const logMarker = `p1-log-${Date.now()}`;
await readCopilot(cookies.get("admin"), logMarker);
let loggedQuery = null;
for (let attempt = 0; attempt < 10 && !loggedQuery; attempt += 1) {
    const { data, error } = await service.from("copilot_queries").select("id, answer, grounded_data_summary").eq("user_id", clients.get("admin").userId).eq("question", logMarker).maybeSingle();
    if (error) throw error;
    loggedQuery = data;
    if (!loggedQuery) await new Promise((resolve) => setTimeout(resolve, 500));
}
assert(loggedQuery?.answer && loggedQuery?.grounded_data_summary, "Copilot query was not persisted with audit fields.");
await service.from("copilot_queries").delete().eq("id", loggedQuery.id);
results.copilotLogging = { persisted: true, auditFields: true, testRowRemoved: true };

console.log(JSON.stringify({ ok: true, checkedAt: new Date().toISOString(), target: baseUrl, results }, null, 2));

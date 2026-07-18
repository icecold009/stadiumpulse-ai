import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
    throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the local environment."
    );
}

const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const validRoles = new Set([
    "admin",
    "ops_manager",
    "sustainability_lead",
    "volunteer_coordinator",
]);

function demoId(namespace, index) {
    return `${namespace}0000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function maskEmail(email) {
    if (!email || !email.includes("@")) return "unknown";
    const [local, domain] = email.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
}

async function upsert(table, rows) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`${table} seed failed: ${error.message}`);
}

const venues = [
    {
        id: demoId(1, 1),
        name: "Northstar Stadium",
        city: "Toronto",
        capacity: 70000,
    },
    {
        id: demoId(1, 2),
        name: "Suncoast Arena",
        city: "Miami",
        capacity: 50000,
    },
];

const zoneDefinitions = [
    [1, 1, "Zone A — North Concourse", 12000],
    [2, 1, "Zone B — East Concourse", 12000],
    [3, 1, "Zone C — South Concourse", 12000],
    [4, 1, "Zone D — West Concourse", 12000],
    [5, 1, "Zone E — Upper Bowl", 11000],
    [6, 1, "Zone F — Lower Bowl", 11000],
    [7, 2, "Zone A — North Concourse", 9000],
    [8, 2, "Zone B — East Concourse", 8000],
    [9, 2, "Zone C — South Concourse", 9000],
    [10, 2, "Zone D — West Concourse", 8000],
    [11, 2, "Zone E — Upper Bowl", 8000],
    [12, 2, "Zone F — Lower Bowl", 8000],
];

const zones = zoneDefinitions.map(([index, venueIndex, label, capacity]) => ({
    id: demoId(2, index),
    venue_id: demoId(1, venueIndex),
    label,
    capacity,
}));

const gateDefinitions = [
    [1, 1, "Gate 1 — North"],
    [2, 1, "Gate 2 — Northeast"],
    [3, 1, "Gate 3 — Southeast"],
    [4, 1, "Gate 4 — South"],
    [5, 1, "Gate 5 — West"],
    [6, 1, "Gate 6 — Accessible Entry"],
    [7, 2, "Gate 1 — North"],
    [8, 2, "Gate 2 — East"],
    [9, 2, "Gate 3 — South"],
    [10, 2, "Gate 4 — West"],
    [11, 2, "Gate 5 — Accessible Entry"],
];

const gates = gateDefinitions.map(([index, venueIndex, label]) => ({
    id: demoId(3, index),
    venue_id: demoId(1, venueIndex),
    label,
}));

const volunteerDefinitions = [
    [1, 1, 1, "Avery Chen", "assigned"],
    [2, 1, 2, "Maya Singh", "assigned"],
    [3, 1, 3, "Noah Williams", "assigned"],
    [4, 1, 4, "Sofia Garcia", "assigned"],
    [5, 1, 5, "Ethan Brown", "assigned"],
    [6, 1, null, "Amara Okafor", "available"],
    [7, 1, null, "Leo Martin", "available"],
    [8, 2, 7, "Isabella Rossi", "assigned"],
    [9, 2, 8, "Mateo Silva", "assigned"],
    [10, 2, 9, "Zara Ahmed", "assigned"],
    [11, 2, 10, "Lucas Miller", "assigned"],
    [12, 2, 11, "Hana Kim", "assigned"],
    [13, 2, null, "Owen Davis", "available"],
    [14, 2, null, "Priya Patel", "available"],
];

const volunteers = volunteerDefinitions.map(
    ([index, venueIndex, zoneIndex, name, status]) => ({
        id: demoId(4, index),
        venue_id: demoId(1, venueIndex),
        zone_id: zoneIndex === null ? null : demoId(2, zoneIndex),
        name,
        status,
    })
);

await upsert("venues", venues);
await upsert("zones", zones);
await upsert("gates", gates);
await upsert("volunteers", volunteers);

const { data: usersPage, error: usersError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
if (usersError) throw new Error(`Auth user audit failed: ${usersError.message}`);

const roleRows = usersPage.users
    .map((user) => ({ user_id: user.id, role: user.user_metadata?.role }))
    .filter((row) => validRoles.has(row.role));

if (roleRows.length > 0) {
    const { error: rolesError } = await supabase
        .from("user_roles")
        .upsert(roleRows, { onConflict: "user_id" });
    if (rolesError) throw new Error(`Role backfill failed: ${rolesError.message}`);
}

const { data: storedRoles, error: storedRolesError } = await supabase
    .from("user_roles")
    .select("user_id, role");
if (storedRolesError) {
    throw new Error(`Role verification failed: ${storedRolesError.message}`);
}

const assignedUserIds = new Set((storedRoles ?? []).map((row) => row.user_id));
const unassignedUsers = usersPage.users
    .filter((user) => !assignedUserIds.has(user.id))
    .map((user) => ({ id: user.id.slice(0, 8), email: maskEmail(user.email) }));

const counts = {};
for (const table of ["venues", "zones", "gates", "volunteers", "user_roles"]) {
    const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
    if (error) throw new Error(`${table} verification failed: ${error.message}`);
    counts[table] = count ?? 0;
}

console.log(
    JSON.stringify(
        {
            ok: true,
            counts,
            roles_backfilled_from_metadata: roleRows.length,
            unassigned_users: unassignedUsers,
        },
        null,
        2
    )
);

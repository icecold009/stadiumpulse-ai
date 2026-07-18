import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;
const appUrl = process.env.PULSEOPS_APP_URL?.replace(/\/$/, "");
if (!url || !anonKey || !serviceRoleKey || !cronSecret || !appUrl) {
    throw new Error("Alert-loop verification requires Supabase variables, CRON_SECRET, and PULSEOPS_APP_URL.");
}

const service = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const { data: roleRow, error: roleError } = await service
    .from("user_roles")
    .select("user_id")
    .eq("role", "ops_manager")
    .single();
if (roleError) throw roleError;

const { data: userData, error: userError } = await service.auth.admin.getUserById(roleRow.user_id);
if (userError || !userData.user.email) throw userError ?? new Error("Ops test user has no email.");
const { data: link, error: linkError } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
});
if (linkError || !link.properties?.hashed_token) throw linkError ?? new Error("No Ops test token.");

const ops = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const { error: otpError } = await ops.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
});
if (otpError) throw otpError;

const [{ data: zones, error: zonesError }, { data: openAlerts, error: alertsError }] =
    await Promise.all([
        service.from("zones").select("id, capacity").order("id"),
        service.from("alerts").select("zone_id").eq("status", "open"),
    ]);
if (zonesError || alertsError) throw zonesError ?? alertsError;

const openZoneIds = new Set((openAlerts ?? []).map((alert) => alert.zone_id));
const target = (zones ?? []).find((zone) => !openZoneIds.has(zone.id));
if (!target) throw new Error("Every zone already has an open alert; cannot isolate an alert-loop test.");

const now = new Date().toISOString();
const testRows = (zones ?? [])
    .filter((zone) => !openZoneIds.has(zone.id))
    .map((zone) => ({
        zone_id: zone.id,
        occupancy:
            zone.id === target.id
                ? Math.round(zone.capacity * 0.96)
                : Math.round(zone.capacity * 0.25),
        recorded_at: now,
    }));

const { data: insertedTelemetry, error: telemetryError } = await service
    .from("zone_telemetry")
    .insert(testRows)
    .select("id");
if (telemetryError) throw telemetryError;

let createdAlertId;
let channel;
try {
    const alertEvent = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Realtime alert event timed out.")), 60_000);
        channel = ops
            .channel(`alert-loop-${Date.now()}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "alerts", filter: `zone_id=eq.${target.id}` },
                (payload) => {
                    clearTimeout(timer);
                    resolve(payload.new);
                }
            )
            .subscribe(async (status) => {
                if (status !== "SUBSCRIBED") return;
                const response = await fetch(`${appUrl}/api/check-alerts`, {
                    method: "POST",
                    headers: { authorization: `Bearer ${cronSecret}` },
                });
                const body = await response.json();
                if (!response.ok) reject(new Error(`Alert route returned ${response.status}: ${body.error}`));
                createdAlertId = body.created?.[0];
            });
    });

    const alert = await alertEvent;
    if (alert.zone_id !== target.id) throw new Error("Realtime delivered the wrong alert.");
    if (!alert.ai_recommendation || !alert.ai_evidence || !alert.snapshot_at) {
        throw new Error("Created alert is missing structured recommendation evidence.");
    }

    console.log(
        JSON.stringify({
            ok: true,
            threshold_detection: true,
            structured_recommendation: true,
            realtime_alert_delivery: true,
            recommendation_source: alert.recommendation_source,
        })
    );
} finally {
    if (channel) await ops.removeChannel(channel);
    if (createdAlertId) await service.from("alerts").delete().eq("id", createdAlertId);
    if (insertedTelemetry?.length) {
        await service
            .from("zone_telemetry")
            .delete()
            .in("id", insertedTelemetry.map((row) => row.id));
    }
    await ops.auth.signOut();
}

// src/app/api/simulate-tick/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { checkAndCreateAlerts } from "@/lib/alerts/check-alerts";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { authorizeSystemRoute } from "@/lib/security/system-route-auth";
import type { Database } from "@/types/database";

type ZoneTelemetryInsert =
    Database["public"]["Tables"]["zone_telemetry"]["Insert"];

type GateScanInsert =
    Database["public"]["Tables"]["gate_scans"]["Insert"];

type SustainabilityMetricInsert =
    Database["public"]["Tables"]["sustainability_metrics"]["Insert"];

type SustainabilityMetricType =
    Database["public"]["Tables"]["sustainability_metrics"]["Row"]["metric_type"];

type ZoneRow =
    Database["public"]["Tables"]["zones"]["Row"];

type GateRow =
    Database["public"]["Tables"]["gates"]["Row"];

type VenueRow =
    Database["public"]["Tables"]["venues"]["Row"];

// ─── Match-phase simulation ────────────────────────────────────────────────
function matchPhase(): { phaseName: string; occupancyFactor: number } {
    const minute = new Date().getUTCMinutes();
    if (minute < 15) {
        const t = minute / 14;
        return { phaseName: "pre_kickoff", occupancyFactor: 0.4 + t * 0.45 };
    } else if (minute < 45) {
        return { phaseName: "in_play", occupancyFactor: 0.85 + Math.random() * 0.1 };
    } else {
        const t = (minute - 45) / 14;
        return { phaseName: "post_match", occupancyFactor: 0.9 - t * 0.7 };
    }
}

function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
}

function jitter(amplitude: number) {
    return (Math.random() + Math.random() - 1) * amplitude;
}

async function runTick() {
    const supabase = createSupabaseServiceRoleClient();
    const { phaseName, occupancyFactor } = matchPhase();

    // ── 1. Fetch reference data — no column selector string so TS resolves the full row type
    const [
        { data: zones, error: zonesErr },
        { data: gates, error: gatesErr },
        { data: venues, error: venuesErr },
    ] = await Promise.all([
        supabase.from("zones").select(),
        supabase.from("gates").select(),
        supabase.from("venues").select(),
    ]);

    if (zonesErr || gatesErr || venuesErr) {
        return { ok: false, error: "fetch_failed", details: { zonesErr, gatesErr, venuesErr } };
    }

    if (!zones?.length || !gates?.length || !venues?.length) {
        return { ok: false, error: "no_seed_data" };
    }

    // Cast to known row types — safe because .select() with no arg returns full rows
    const typedZones = zones as ZoneRow[];
    const typedGates = gates as GateRow[];
    const typedVenues = venues as VenueRow[];

    const now = new Date().toISOString();

    // ── 2. zone_telemetry ──────────────────────────────────────────────────
    const telemetryRows: ZoneTelemetryInsert[] = typedZones.map((zone) => {
        const base = Math.round(zone.capacity * occupancyFactor);
        const noise = Math.round(jitter(zone.capacity * 0.08));
        return {
            zone_id: zone.id,
            occupancy: clamp(base + noise, 0, zone.capacity),
            recorded_at: now,
        };
    });

    // ── 3. gate_scans ──────────────────────────────────────────────────────
    const gateRateByPhase: Record<string, [number, number]> = {
        pre_kickoff: [180, 420],
        in_play: [5, 30],
        post_match: [40, 160],
    };
    const [minRate, maxRate] = gateRateByPhase[phaseName];
    const gateScanRows: GateScanInsert[] = typedGates.map((gate) => ({
        gate_id: gate.id,
        scan_count: Math.round(minRate + Math.random() * (maxRate - minRate)),
        recorded_at: now,
    }));

    // ── 4. sustainability_metrics ──────────────────────────────────────────
    const sustainabilityRows: SustainabilityMetricInsert[] = typedVenues.flatMap((venue) => {
        const load = occupancyFactor;
        const metrics: Array<{ type: SustainabilityMetricType; value: number; target: number }> = [
            {
                type: "energy_kwh",
                value: clamp(2800 + load * 4200 + jitter(300), 1000, 8000),
                target: 6000,
            },
            {
                type: "water_l",
                value: clamp(15000 + load * 25000 + jitter(2000), 5000, 45000),
                target: 35000,
            },
            {
                type: "waste_diverted_pct",
                value: clamp(52 + occupancyFactor * 18 + jitter(4), 30, 95),
                target: 75,
            },
        ];
        return metrics.map((m) => ({
            venue_id: venue.id,
            metric_type: m.type,
            value: Math.round(m.value * 10) / 10,
            target: m.target,
            recorded_at: now,
        }));
    });

    // ── 5. Bulk insert ────────────────────────────────────────────────────
    const [telRes, gateRes, sustRes] = await Promise.all([
        supabase.from("zone_telemetry").insert(telemetryRows as unknown as never[]),
        supabase.from("gate_scans").insert(gateScanRows as unknown as never[]),
        supabase.from("sustainability_metrics").insert(sustainabilityRows as unknown as never[]),
    ]);

    const errors = [telRes.error, gateRes.error, sustRes.error].filter(Boolean);
    if (errors.length > 0) {
        console.error("simulate-tick: insert errors", errors);
        return { ok: false, error: "insert_failed", details: errors };
    }

    const alertDetection = await checkAndCreateAlerts();

    return {
        ok: true,
        phase: phaseName,
        occupancyFactor: Math.round(occupancyFactor * 100) + "%",
        inserted: {
            zone_telemetry: telemetryRows.length,
            gate_scans: gateScanRows.length,
            sustainability_metrics: sustainabilityRows.length,
        },
        recorded_at: now,
        alert_detection: alertDetection,
    };
}

function jsonResult(result: Awaited<ReturnType<typeof runTick>>) {
    if (!result.ok) {
        const status = result.error === "no_seed_data" ? 422 : 500;
        return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
}

async function handleTick(request: Request) {
    const authorization = await authorizeSystemRoute(request);
    if (!authorization.ok) {
        return NextResponse.json(
            { error: authorization.error },
            { status: authorization.status }
        );
    }

    const allowed = await consumeRateLimit({
        subject: authorization.caller.subject,
        action: "simulate-tick",
        limit: authorization.caller.kind === "cron" ? 2 : 4,
        windowSeconds: 60,
    });
    if (!allowed) {
        return NextResponse.json(
            { error: "Simulation is temporarily limited. Try again shortly." },
            { status: 429 }
        );
    }

    try {
        const result = await runTick();
        return jsonResult(result);
    } catch (error) {
        console.error("simulate-tick: unexpected error", error);
        return NextResponse.json(
            {
                ok: false,
                error: "unexpected_error",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}

// POST — for manual dashboard trigger / local dev
export async function POST(request: Request) {
    return handleTick(request);
}

// GET — for Vercel Cron (cron jobs call GET by default)
export async function GET(request: Request) {
    return handleTick(request);
}

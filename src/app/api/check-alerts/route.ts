import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { getAnthropicClient, COPILOT_MODEL } from "@/lib/ai/client";
import type { Database } from "@/types/database";

type AlertInsert = Database["public"]["Tables"]["alerts"]["Insert"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];

const OCCUPANCY_WARN_PCT = 0.8;
const OCCUPANCY_CRITICAL_PCT = 0.9;

type LatestTelemetry = {
    occupancy: number;
    recorded_at: string;
};

export async function POST() {
    const db = createSupabaseServiceRoleClient();

    const zonesQuery = await db
        .from("zones")
        .select("id, venue_id, label, capacity");

    if (zonesQuery.error) {
        return NextResponse.json(
            { error: zonesQuery.error.message },
            { status: 500 }
        );
    }

    const zones = (zonesQuery.data ?? []) as ZoneRow[];

    const openAlertsQuery = await db
        .from("alerts")
        .select("zone_id")
        .eq("status", "open");

    if (openAlertsQuery.error) {
        return NextResponse.json(
            { error: openAlertsQuery.error.message },
            { status: 500 }
        );
    }

    const openAlertZoneIds = new Set(
        ((openAlertsQuery.data ?? []) as Pick<AlertRow, "zone_id">[])
            .map((a) => a.zone_id)
            .filter((zoneId): zoneId is string => zoneId !== null)
    );

    const created: string[] = [];
    const ai = getAnthropicClient();

    for (const zone of zones) {
        if (openAlertZoneIds.has(zone.id)) continue;
        if (!zone.capacity || zone.capacity <= 0) continue;

        const telemetryQuery = await db
            .from("zone_telemetry")
            .select("occupancy, recorded_at")
            .eq("zone_id", zone.id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (telemetryQuery.error) continue;

        const telemetry = telemetryQuery.data as LatestTelemetry | null;
        if (!telemetry) continue;

        const pct = telemetry.occupancy / zone.capacity;

        let severity: "warn" | "critical" | null = null;
        if (pct >= OCCUPANCY_CRITICAL_PCT) severity = "critical";
        else if (pct >= OCCUPANCY_WARN_PCT) severity = "warn";

        if (!severity) continue;

        const occupancyDisplay = `${telemetry.occupancy}/${zone.capacity} (${Math.round(
            pct * 100
        )}%)`;
        const message = `Zone "${zone.label}" occupancy at ${occupancyDisplay}`;

        let ai_recommendation =
            "Monitor the situation closely and prepare crowd-control staff nearby.";

        try {
            const response = await ai.messages.create({
                model: COPILOT_MODEL,
                max_tokens: 120,
                system:
                    "You are a stadium operations AI. Reply with one short actionable recommendation, maximum 2 sentences, specific and operational.",
                messages: [
                    {
                        role: "user",
                        content: `Alert: ${message}. Severity: ${severity}. What should ops staff do right now?`,
                    },
                ],
            });

            const firstBlock = response.content[0];
            if (firstBlock?.type === "text") {
                ai_recommendation = firstBlock.text.trim();
            }
        } catch {
            // fallback stays in place
        }

        const newAlert: AlertInsert = {
            venue_id: zone.venue_id,
            zone_id: zone.id,
            severity,
            message,
            ai_recommendation,
            status: "open",
        };

        const insertQuery = await db
            .from("alerts")
            .insert(newAlert)
            .select("id")
            .single();

        if (insertQuery?.error) continue;

        const inserted = insertQuery.data as { id: string } | null;
        if (inserted?.id) created.push(inserted.id);
    }

    return NextResponse.json({
        created,
        count: created.length,
    });
}
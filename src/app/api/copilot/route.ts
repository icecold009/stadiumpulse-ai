import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { getAnthropicClient, COPILOT_MODEL } from "@/lib/ai/client";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { isRole } from "@/lib/auth/roles";
import {
    COPILOT_SYSTEM_PROMPT,
    buildCopilotUserContent,
    buildDataBlock,
    parseGroundedResponse,
    type DataSlice,
} from "@/lib/ai/copilot-prompt";

export const runtime = "nodejs";

const WINDOW_MINUTES = 15;

type CopilotRequestBody = {
    question?: unknown;
};

type RawTelemetry = {
    zone_id: string;
    occupancy: number;
    recorded_at: string;
};

type RawZone = {
    id: string;
    label: string;
    capacity: number;
    venues: { name: string } | null;
};

type RawAlert = {
    id: string;
    severity: "warn" | "critical";
    message: string;
    ai_recommendation: string | null;
    status: "open" | "handled";
    created_at: string;
    zones: {
        label: string;
        venues: { name: string } | null;
    } | null;
    venues: { name: string } | null;
};

type RawSustainabilityMetric = {
    metric_type: string;
    value: number;
    target: number;
    recorded_at: string;
    venues: { name: string } | null;
};

type RawVolunteer = {
    name: string;
    status: string;
    venues: { name: string } | null;
    zones: { label: string } | null;
};

type RawVenueAccess = {
    venue_id: string;
    venues: { name: string } | null;
};

function getCopilotErrorMessage(err: unknown): string {
    if (err && typeof err === "object") {
        const maybeError = err as {
            status?: number;
            type?: string | null;
            requestID?: string | null;
        };

        const status = maybeError.status;

        if (status === 401) return "AI service authentication failed. Check the server configuration.";
        if (status === 404) return "AI model or endpoint was not found. Check the server configuration.";
        if (status === 429) return "AI service rate-limited the request. Try again shortly.";
        if (status) return `AI service returned an error (${status}). Try again shortly.`;
    }

    return "The AI service is temporarily unavailable. Try again shortly.";
}

export async function POST(request: Request) {
    let body: CopilotRequestBody;

    try {
        body = (await request.json()) as CopilotRequestBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body.question !== "string") {
        return NextResponse.json(
            { error: "question is required and must be a string." },
            { status: 400 }
        );
    }

    const question = body.question.trim();

    if (!question) {
        return NextResponse.json(
            { error: "question must not be empty." },
            { status: 400 }
        );
    }

    if (question.length > 500) {
        return NextResponse.json(
            { error: "question must be 500 characters or fewer." },
            { status: 400 }
        );
    }

    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (roleError) {
        console.error("[copilot] role query error:", {
            userId: user.id,
            message: roleError.message,
        });
        return NextResponse.json(
            { error: "Failed to resolve Copilot access." },
            { status: 500 }
        );
    }

    if (!isRole(roleRow?.role)) {
        return NextResponse.json(
            { error: "A valid operator role is required." },
            { status: 403 }
        );
    }

    const role = roleRow.role;
    let venueIds: string[] = [];
    let venueNames: string[] = [];

    if (role === "admin") {
        const { data, error } = await supabase
            .from("venues")
            .select("id, name")
            .order("name");

        if (error) {
            console.error("[copilot] admin venue query error:", {
                userId: user.id,
                message: error.message,
            });
            return NextResponse.json(
                { error: "Failed to resolve Copilot access." },
                { status: 500 }
            );
        }

        venueIds = (data ?? []).map((venue) => venue.id);
        venueNames = (data ?? []).map((venue) => venue.name);
    } else {
        const { data, error } = await supabase
            .from("user_venue_access")
            .select("venue_id, venues(name)")
            .eq("user_id", user.id);

        if (error) {
            console.error("[copilot] venue access query error:", {
                userId: user.id,
                message: error.message,
            });
            return NextResponse.json(
                { error: "Failed to resolve Copilot access." },
                { status: 500 }
            );
        }

        const accessRows = (data ?? []) as unknown as RawVenueAccess[];
        venueIds = [...new Set(accessRows.map((row) => row.venue_id))];
        venueNames = [
            ...new Set(
                accessRows
                    .map((row) => row.venues?.name)
                    .filter((name): name is string => Boolean(name))
            ),
        ];
    }

    if (venueIds.length === 0) {
        return NextResponse.json(
            { error: "No venue access is assigned to this account." },
            { status: 403 }
        );
    }

    const allowed = await consumeRateLimit({
        subject: user.id,
        action: "copilot",
        limit: 10,
        windowSeconds: 60,
    });
    if (!allowed) {
        return NextResponse.json(
            { error: "Copilot is limited to 10 questions per minute. Try again shortly." },
            { status: 429 }
        );
    }

    const windowStart = new Date(
        Date.now() - WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    const { data: zoneData, error: zoneError } = await supabase
        .from("zones")
        .select("id, label, capacity, venues(name)")
        .in("venue_id", venueIds);

    if (zoneError) {
        console.error("[copilot] zone scope query error:", {
            userId: user.id,
            role,
            message: zoneError.message,
        });
        return NextResponse.json(
            { error: "Failed to load authorized venue data." },
            { status: 500 }
        );
    }

    const zones = (zoneData ?? []) as unknown as RawZone[];
    const zoneIds = zones.map((zone) => zone.id);
    const zonesById = new Map(zones.map((zone) => [zone.id, zone]));
    const includeTelemetry =
        role === "admin" ||
        role === "ops_manager" ||
        role === "volunteer_coordinator";
    const includeAlerts = role === "admin" || role === "ops_manager";
    const includeSustainability =
        role === "admin" || role === "sustainability_lead";
    const includeVolunteers =
        role === "admin" || role === "volunteer_coordinator";

    const telemetryQuery = includeTelemetry && zoneIds.length > 0
        ? supabase
              .from("zone_telemetry")
              .select("zone_id, occupancy, recorded_at")
              .in("zone_id", zoneIds)
              .gte("recorded_at", windowStart)
              .order("recorded_at", { ascending: false })
              .limit(50)
        : Promise.resolve({ data: [], error: null });
    const alertsQuery = includeAlerts
        ? supabase
              .from("alerts")
              .select("id, severity, message, ai_recommendation, status, created_at, zones(label, venues(name)), venues(name)")
              .in("venue_id", venueIds)
              .eq("status", "open")
              .order("created_at", { ascending: false })
              .limit(20)
        : Promise.resolve({ data: [], error: null });
    const sustainabilityQuery = includeSustainability
        ? supabase
              .from("sustainability_metrics")
              .select("metric_type, value, target, recorded_at, venues(name)")
              .in("venue_id", venueIds)
              .gte("recorded_at", windowStart)
              .order("recorded_at", { ascending: false })
              .limit(50)
        : Promise.resolve({ data: [], error: null });
    const volunteersQuery = includeVolunteers
        ? supabase
              .from("volunteers")
              .select("name, status, venues(name), zones(label)")
              .in("venue_id", venueIds)
              .limit(50)
        : Promise.resolve({ data: [], error: null });

    const [telemetryResult, alertsResult, sustainabilityResult, volunteersResult] =
        await Promise.all([
            telemetryQuery,
            alertsQuery,
            sustainabilityQuery,
            volunteersQuery,
        ]);

    if (telemetryResult.error) {
        console.error("[copilot] telemetry query error:", telemetryResult.error);
        return NextResponse.json(
            { error: "Failed to load telemetry data." },
            { status: 500 }
        );
    }

    if (alertsResult.error) {
        console.error("[copilot] alerts query error:", alertsResult.error);
        return NextResponse.json(
            { error: "Failed to load alerts data." },
            { status: 500 }
        );
    }

    if (sustainabilityResult.error) {
        console.error("[copilot] sustainability query error:", sustainabilityResult.error);
        return NextResponse.json(
            { error: "Failed to load sustainability data." },
            { status: 500 }
        );
    }

    if (volunteersResult.error) {
        console.error("[copilot] volunteer query error:", volunteersResult.error);
        return NextResponse.json(
            { error: "Failed to load volunteer data." },
            { status: 500 }
        );
    }

    const telemetry = ((telemetryResult.data ?? []) as unknown as RawTelemetry[]).map((row) => ({
        zone_id: row.zone_id,
        zone_label: zonesById.get(row.zone_id)?.label ?? "Unknown zone",
        venue_name: zonesById.get(row.zone_id)?.venues?.name ?? "Unknown venue",
        occupancy: row.occupancy,
        zone_capacity: zonesById.get(row.zone_id)?.capacity ?? 0,
        recorded_at: row.recorded_at,
    }));

    const alerts = ((alertsResult.data ?? []) as unknown as RawAlert[]).map((row) => ({
        id: row.id,
        zone_label: row.zones?.label ?? "Venue-wide",
        venue_name: row.zones?.venues?.name ?? row.venues?.name ?? "Unknown venue",
        severity: row.severity,
        message: row.message,
        ai_recommendation: row.ai_recommendation ?? "",
        created_at: row.created_at,
    }));

    const sustainability = ((sustainabilityResult.data ?? []) as unknown as RawSustainabilityMetric[]).map((row) => ({
        venue_name: row.venues?.name ?? "Unknown venue",
        metric_type: row.metric_type,
        value: row.value,
        target: row.target,
        recorded_at: row.recorded_at,
    }));

    const volunteers = ((volunteersResult.data ?? []) as unknown as RawVolunteer[]).map((row) => ({
        venue_name: row.venues?.name ?? "Unknown venue",
        zone_label: row.zones?.label ?? "Unassigned",
        name: row.name,
        status: row.status,
    }));

    const slice: DataSlice = {
        requesterRole: role,
        venueNames,
        telemetry,
        alerts,
        sustainability,
        volunteers,
        windowMinutes: WINDOW_MINUTES,
        fetchedAt: new Date().toISOString(),
    };

    const dataBlock = buildDataBlock(slice);
    const groundedSummary = [
        `${venueIds.length} authorized venues`,
        `${telemetry.length} telemetry rows`,
        `${alerts.length} open alerts`,
        `${sustainability.length} sustainability rows`,
        `${volunteers.length} volunteer rows`,
        `window ${WINDOW_MINUTES} min`,
    ].join(" | ");

    const ai = getAnthropicClient();

    let stream;
    try {
        stream = await ai.messages.create({
            model: COPILOT_MODEL,
            max_tokens: 512,
            system: COPILOT_SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: buildCopilotUserContent(dataBlock, question),
                },
            ],
            stream: true,
        });
    } catch (err) {
        console.error("[copilot] AI stream init error:", {
            userId: user.id,
            message: getCopilotErrorMessage(err),
        });

        return NextResponse.json(
            { error: getCopilotErrorMessage(err) },
            { status: 502 }
        );
    }

    const encoder = new TextEncoder();
    let rawAnswer = "";

    const readable = new ReadableStream({
        async start(controller) {
            try {
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "meta",
                            groundedSummary,
                            dataWindowMinutes: WINDOW_MINUTES,
                            requesterRole: role,
                            venuesIncluded: venueNames,
                            zonesIncluded: [...new Set(telemetry.map((t) => `${t.venue_name} / ${t.zone_label}`))],
                            alertCount: alerts.length,
                        })}\n\n`
                    )
                );

                for await (const event of stream) {
                    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                        const chunk = event.delta.text ?? "";
                        if (!chunk) continue;
                        rawAnswer += chunk;
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: "delta",
                                    text: chunk,
                                })}\n\n`
                            )
                        );
                    }

                }

                const { answer, groundedSummary: parsedGroundedSummary } =
                    parseGroundedResponse(rawAnswer);

                const finalAnswer = answer || rawAnswer.trim();
                const finalGroundedSummary = parsedGroundedSummary || groundedSummary;

                const serviceRole = createSupabaseServiceRoleClient();
                try {
                    const { error: loggingError } = await serviceRole
                        .from("copilot_queries")
                        .insert({
                            user_id: user.id,
                            question,
                            grounded_data_summary: finalGroundedSummary,
                            answer: finalAnswer,
                        });

                    if (loggingError) {
                        console.error("[copilot] query logging error:", {
                            userId: user.id,
                            message: loggingError.message,
                        });
                    }
                } catch (loggingError) {
                    console.error("[copilot] query logging exception:", {
                        userId: user.id,
                        message: getCopilotErrorMessage(loggingError),
                    });
                }

                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "done",
                            groundedSummary: finalGroundedSummary,
                        })}\n\n`
                    )
                );
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
            } catch (err) {
                console.error("[copilot] stream error:", {
                    userId: user.id,
                    message: getCopilotErrorMessage(err),
                });

                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "error",
                            error: getCopilotErrorMessage(err),
                        })}\n\n`
                    )
                );
                controller.close();
            }
        },
    });

    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}

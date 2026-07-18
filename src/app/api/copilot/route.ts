import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { getAnthropicClient, COPILOT_MODEL } from "@/lib/ai/client";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
    COPILOT_SYSTEM_PROMPT,
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
    zones: {
        label: string;
        capacity: number;
        venues: { name: string } | null;
    } | null;
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

function getCopilotErrorMessage(err: unknown): string {
    if (err && typeof err === "object") {
        const maybeError = err as {
            status?: number;
            message?: string;
            type?: string | null;
            requestID?: string | null;
            error?: { message?: string; type?: string };
        };

        const status = maybeError.status;
        const detail = maybeError.message ?? maybeError.error?.message;

        if (status === 401) return "AI service rejected the API key. Check your server AI key.";
        if (status === 404) return "AI model or endpoint not found. Check the configured model.";
        if (status === 429) return "AI service rate-limited the request. Try again shortly.";
        if (status && detail) return `AI service error (${status}): ${detail}`;
        if (detail) return detail;
    }

    return err instanceof Error ? err.message : "Unknown AI service error.";
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

    const [telemetryResult, alertsResult] = await Promise.all([
        supabase
            .from("zone_telemetry")
            .select("zone_id, occupancy, recorded_at, zones(label, capacity, venues(name))")
            .gte("recorded_at", windowStart)
            .order("recorded_at", { ascending: false })
            .limit(50),

        supabase
            .from("alerts")
            .select("id, severity, message, ai_recommendation, status, created_at, zones(label, venues(name)), venues(name)")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(20),
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

    const telemetry = ((telemetryResult.data ?? []) as unknown as RawTelemetry[]).map((row) => ({
        zone_id: row.zone_id,
        zone_label: row.zones?.label ?? "Unknown zone",
        venue_name: row.zones?.venues?.name ?? "Unknown venue",
        occupancy: row.occupancy,
        zone_capacity: row.zones?.capacity ?? 0,
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

    const slice: DataSlice = {
        telemetry,
        alerts,
        windowMinutes: WINDOW_MINUTES,
        fetchedAt: new Date().toISOString(),
    };

    const dataBlock = buildDataBlock(slice);
    const groundedSummary = [
        `${telemetry.length} telemetry rows`,
        `${alerts.length} open alerts`,
        `window ${WINDOW_MINUTES} min`,
    ].join(" • ");

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
                    content: [
                        { type: "text", text: dataBlock },
                        { type: "text", text: `QUESTION:\n${question}` },
                    ],
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
                await serviceRole.from("copilot_queries").insert({
                    user_id: user.id,
                    question,
                    grounded_data_summary: finalGroundedSummary,
                    answer: finalAnswer,
                });

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

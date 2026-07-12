import { NextResponse } from "next/server";

type CopilotRequestBody = {
    question?: unknown;
};

export async function POST(request: Request) {
    let body: CopilotRequestBody;

    try {
        body = (await request.json()) as CopilotRequestBody;
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body." },
            { status: 400 },
        );
    }

    if (typeof body.question !== "string") {
        return NextResponse.json(
            { error: "question is required and must be a string." },
            { status: 400 },
        );
    }

    const question = body.question.trim();

    if (!question) {
        return NextResponse.json(
            { error: "question is required and must not be empty." },
            { status: 400 },
        );
    }

    if (question.length > 500) {
        return NextResponse.json(
            { error: "question must be 500 characters or fewer." },
            { status: 400 },
        );
    }

    // Phase 5: fetch the relevant Supabase data slice, build the grounded prompt, and stream Claude's response here.
    return NextResponse.json(
        { error: "Not implemented yet." },
        { status: 501 },
    );
}

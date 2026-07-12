import { NextResponse } from "next/server";

export async function GET() {
    // Phase 4: list alerts from Supabase here once the alert feed is wired up.
    return NextResponse.json(
        { error: "Not implemented yet." },
        { status: 501 },
    );
}

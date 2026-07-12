import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        for (const { name, value, options } of cookiesToSet) {
                            cookieStore.set(name, value, options);
                        }
                    } catch {
                        // Server components cannot always set cookies; callers in route handlers can.
                    }
                },
            },
        },
    );
}

// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    for (const { name, value, options } of cookiesToSet) {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    // Not logged in → send to /login (except if already there)
    if (!user && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Already logged in → don't let them sit on /login
    if (user && pathname === "/login") {
        return NextResponse.redirect(new URL("/overview", request.url));
    }

    const role = user?.user_metadata?.role as string | undefined;

    // Role-based route protection
    const roleGuards: Record<string, string[]> = {
        "/ops": ["admin", "ops_manager"],
        "/sustainability": ["admin", "sustainability_lead"],
        "/volunteers": ["admin", "volunteer_coordinator"],
        "/overview": ["admin", "ops_manager", "sustainability_lead", "volunteer_coordinator"],
    };

    for (const [route, allowedRoles] of Object.entries(roleGuards)) {
        if (pathname.startsWith(route) && !(role && allowedRoles.includes(role))) {
            return NextResponse.redirect(new URL("/overview", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
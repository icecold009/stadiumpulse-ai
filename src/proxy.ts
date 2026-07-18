import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, defaultRouteForRole, isRole } from "@/lib/auth/roles";

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    for (const { name, value, options } of cookiesToSet) {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    }
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;
    const isPublicAuthPage = pathname === "/login" || pathname === "/unauthorized";

    if (!user && !isPublicAuthPage) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!user) return response;

    const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!isRole(roleRow?.role)) {
        if (pathname !== "/unauthorized") {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
        return response;
    }

    const role = roleRow.role;
    if (isPublicAuthPage) {
        return NextResponse.redirect(
            new URL(defaultRouteForRole(role), request.url)
        );
    }

    if (!canAccessPath(role, pathname)) {
        return NextResponse.redirect(
            new URL(defaultRouteForRole(role), request.url)
        );
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

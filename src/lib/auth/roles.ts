export const ROLES = [
    "admin",
    "ops_manager",
    "sustainability_lead",
    "volunteer_coordinator",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_ROUTE_ACCESS: Readonly<Record<string, readonly Role[]>> = {
    "/ops": ["admin", "ops_manager"],
    "/sustainability": ["admin", "sustainability_lead"],
    "/volunteers": ["admin", "volunteer_coordinator"],
    "/overview": ["admin"],
};

export type CopilotDataAccess = {
    telemetry: boolean;
    alerts: boolean;
    sustainability: boolean;
    volunteers: boolean;
};

export function isRole(value: unknown): value is Role {
    return typeof value === "string" && ROLES.includes(value as Role);
}

export function defaultRouteForRole(role: Role): string {
    if (role === "admin") return "/overview";
    if (role === "ops_manager") return "/ops";
    if (role === "sustainability_lead") return "/sustainability";
    return "/volunteers";
}

export function canAccessPath(role: Role, pathname: string): boolean {
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTE_ACCESS)) {
        if (pathname.startsWith(route)) return allowedRoles.includes(role);
    }
    return true;
}

export function copilotDataAccessForRole(role: Role): CopilotDataAccess {
    return {
        telemetry:
            role === "admin" ||
            role === "ops_manager" ||
            role === "volunteer_coordinator",
        alerts: role === "admin" || role === "ops_manager",
        sustainability: role === "admin" || role === "sustainability_lead",
        volunteers: role === "admin" || role === "volunteer_coordinator",
    };
}

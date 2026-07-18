export const ROLES = [
    "admin",
    "ops_manager",
    "sustainability_lead",
    "volunteer_coordinator",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
    return typeof value === "string" && ROLES.includes(value as Role);
}

export function defaultRouteForRole(role: Role): string {
    if (role === "admin") return "/overview";
    if (role === "ops_manager") return "/ops";
    if (role === "sustainability_lead") return "/sustainability";
    return "/volunteers";
}

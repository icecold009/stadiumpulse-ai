import test from "node:test";
import assert from "node:assert/strict";
import {
    canAccessPath,
    copilotDataAccessForRole,
    defaultRouteForRole,
    isRole,
} from "../src/lib/auth/roles.ts";

const matrix = {
    admin: ["/overview", "/ops", "/ops/alerts", "/sustainability", "/volunteers"],
    ops_manager: ["/ops", "/ops/alerts"],
    sustainability_lead: ["/sustainability"],
    volunteer_coordinator: ["/volunteers"],
};

test("accepts only trusted application roles", () => {
    for (const role of Object.keys(matrix)) assert.equal(isRole(role), true);
    for (const value of [undefined, null, "owner", "admin ", { role: "admin" }]) {
        assert.equal(isRole(value), false);
    }
});

test("maps every role to its documented default route", () => {
    assert.equal(defaultRouteForRole("admin"), "/overview");
    assert.equal(defaultRouteForRole("ops_manager"), "/ops");
    assert.equal(defaultRouteForRole("sustainability_lead"), "/sustainability");
    assert.equal(defaultRouteForRole("volunteer_coordinator"), "/volunteers");
});

test("enforces the complete protected route matrix", () => {
    const protectedPaths = [
        "/overview",
        "/ops",
        "/ops/alerts",
        "/sustainability",
        "/volunteers",
    ];
    for (const [role, allowedPaths] of Object.entries(matrix)) {
        for (const path of protectedPaths) {
            assert.equal(
                canAccessPath(role, path),
                allowedPaths.includes(path),
                `${role} access to ${path}`
            );
        }
        assert.equal(canAccessPath(role, "/unscoped"), true);
    }
});

test("limits Copilot data categories by trusted role", () => {
    assert.deepEqual(copilotDataAccessForRole("admin"), {
        telemetry: true,
        alerts: true,
        sustainability: true,
        volunteers: true,
    });
    assert.deepEqual(copilotDataAccessForRole("ops_manager"), {
        telemetry: true,
        alerts: true,
        sustainability: false,
        volunteers: false,
    });
    assert.deepEqual(copilotDataAccessForRole("sustainability_lead"), {
        telemetry: false,
        alerts: false,
        sustainability: true,
        volunteers: false,
    });
    assert.deepEqual(copilotDataAccessForRole("volunteer_coordinator"), {
        telemetry: true,
        alerts: false,
        sustainability: false,
        volunteers: true,
    });
});

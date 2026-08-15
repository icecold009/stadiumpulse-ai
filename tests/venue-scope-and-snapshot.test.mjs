import test from "node:test";
import assert from "node:assert/strict";
import { buildVenueScope } from "../src/lib/auth/venue-scope-policy.ts";
import { classifyFreshness } from "../src/lib/ops/freshness.ts";
import { buildOpsSnapshot } from "../src/lib/ops/snapshot.ts";

const venueA = "11111111-1111-4111-8111-111111111111";
const venueB = "22222222-2222-4222-8222-222222222222";
const zoneA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const gateA = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("admin venue scope supports all venues and selected venue", () => {
    const all = buildVenueScope(
        "admin",
        [{ id: venueA, name: "A" }, { id: venueB, name: "B" }]
    );
    assert.equal(all.ok, true);
    if (all.ok) {
        assert.equal(all.scope.isAllVenues, true);
        assert.deepEqual(all.scope.queryVenueIds, [venueA, venueB]);
    }

    const selected = buildVenueScope(
        "admin",
        [{ id: venueA, name: "A" }, { id: venueB, name: "B" }],
        venueB
    );
    assert.equal(selected.ok, true);
    if (selected.ok) assert.deepEqual(selected.scope.queryVenueIds, [venueB]);
});

test("non-admin scope defaults to and enforces assigned venues", () => {
    const result = buildVenueScope("ops_manager", [{ id: venueA, name: "A" }]);
    assert.equal(result.ok, true);
    if (result.ok) {
        assert.equal(result.scope.selectedVenueId, venueA);
        assert.deepEqual(result.scope.queryVenueIds, [venueA]);
    }

    const denied = buildVenueScope("ops_manager", [{ id: venueA, name: "A" }], venueB);
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.status, 403);
});

test("freshness classifies missing, fresh, stale, and old data", () => {
    const now = Date.parse("2026-08-15T12:00:00.000Z");
    assert.equal(classifyFreshness(null, now).state, "missing");
    assert.equal(classifyFreshness("2026-08-15T11:58:00.000Z", now).state, "fresh");
    assert.equal(classifyFreshness("2026-08-15T11:50:00.000Z", now).state, "stale");
    assert.equal(classifyFreshness("2026-08-15T11:30:00.000Z", now).state, "missing");
});

test("operations snapshot derives risk, trends, gates, and alerts", () => {
    const now = Date.parse("2026-08-15T12:00:00.000Z");
    const result = buildOpsSnapshot({
        now,
        selectedVenueId: venueA,
        zones: [{ id: zoneA, venue_id: venueA, label: "North", capacity: 100 }],
        telemetry: [
            { zone_id: zoneA, occupancy: 96, recorded_at: "2026-08-15T11:59:00.000Z" },
            { zone_id: zoneA, occupancy: 80, recorded_at: "2026-08-15T11:58:00.000Z" },
        ],
        gates: [{ id: gateA, venue_id: venueA, label: "Gate 1" }],
        gateScans: [
            { gate_id: gateA, scan_count: 120, recorded_at: "2026-08-15T11:59:00.000Z" },
            { gate_id: gateA, scan_count: 100, recorded_at: "2026-08-15T11:58:00.000Z" },
        ],
        alerts: [{
            id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            venue_id: venueA,
            zone_id: zoneA,
            severity: "critical",
            message: "North capacity breach",
            ai_recommendation: "Redirect inflow",
            ai_urgency: "immediate",
            ai_evidence: "96% occupancy",
            ai_limitations: "Synthetic snapshot",
            ai_confidence: "high",
            recommendation_source: "ai",
            snapshot_at: "2026-08-15T11:59:00.000Z",
            operator_decision: null,
            decision_at: null,
            status: "open",
            created_at: "2026-08-15T11:59:00.000Z",
        }],
    });

    assert.equal(result.zones[0].status, "critical");
    assert.equal(result.zones[0].trend, "rising");
    assert.equal(result.zones[0].openAlertCount, 1);
    assert.equal(result.gates[0].trend, "rising");
    assert.equal(result.alerts[0].zoneLabel, "North");
    assert.deepEqual(result.decisionTimeline, []);
});

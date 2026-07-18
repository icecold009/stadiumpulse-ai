import test from "node:test";
import assert from "node:assert/strict";
import { buildCopilotContext } from "../src/lib/ai/copilot-context.ts";

test("builds an auditable Copilot slice from authorized database rows", () => {
    const recordedAt = "2026-07-18T12:00:00.000Z";
    const { slice, groundedSummary } = buildCopilotContext({
        role: "ops_manager",
        venueIds: ["venue-a"],
        venueNames: ["Northstar Stadium"],
        zones: [
            { id: "zone-a", label: "North Concourse", capacity: 1000, venues: { name: "Northstar Stadium" } },
        ],
        telemetryRows: [{ zone_id: "zone-a", occupancy: 850, recorded_at: recordedAt }],
        alertRows: [
            {
                id: "alert-a",
                severity: "warn",
                message: "Capacity warning",
                ai_recommendation: null,
                status: "open",
                created_at: recordedAt,
                zones: { label: "North Concourse", venues: { name: "Northstar Stadium" } },
                venues: { name: "Northstar Stadium" },
            },
        ],
        sustainabilityRows: [],
        volunteerRows: [],
        windowMinutes: 15,
        fetchedAt: recordedAt,
    });

    assert.equal(slice.telemetry[0].zone_capacity, 1000);
    assert.equal(slice.telemetry[0].venue_name, "Northstar Stadium");
    assert.equal(slice.alerts[0].ai_recommendation, "");
    assert.equal(slice.fetchedAt, recordedAt);
    assert.equal(
        groundedSummary,
        "1 authorized venues | 1 telemetry rows | 1 open alerts | 0 sustainability rows | 0 volunteer rows | window 15 min"
    );
});

test("uses honest unknown labels when joins are missing", () => {
    const { slice } = buildCopilotContext({
        role: "admin",
        venueIds: [],
        venueNames: [],
        zones: [],
        telemetryRows: [{ zone_id: "missing", occupancy: 1, recorded_at: "bad" }],
        alertRows: [],
        sustainabilityRows: [],
        volunteerRows: [],
        windowMinutes: 15,
        fetchedAt: "2026-07-18T12:00:00.000Z",
    });
    assert.equal(slice.telemetry[0].zone_label, "Unknown zone");
    assert.equal(slice.telemetry[0].venue_name, "Unknown venue");
    assert.equal(slice.telemetry[0].zone_capacity, 0);
});

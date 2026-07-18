import test from "node:test";
import assert from "node:assert/strict";
import {
    fallbackResourceAdvisor,
    parseResourceAdvisor,
    prepareAdvisorZones,
} from "../src/lib/ai/resource-advisor.ts";

const inputs = [
    {
        zoneId: "zone-a",
        zoneLabel: "North Concourse",
        venueName: "Northstar Stadium",
        capacity: 1_000,
        currentOccupancy: 850,
        currentRecordedAt: "2026-07-18T12:10:00.000Z",
        previousOccupancy: 750,
        previousRecordedAt: "2026-07-18T12:00:00.000Z",
        availableVolunteers: 2,
    },
    {
        zoneId: "zone-b",
        zoneLabel: "South Concourse",
        venueName: "Northstar Stadium",
        capacity: 1_000,
        currentOccupancy: 400,
        currentRecordedAt: "2026-07-18T12:10:00.000Z",
        previousOccupancy: 420,
        previousRecordedAt: "2026-07-18T12:00:00.000Z",
        availableVolunteers: 2,
    },
];

test("projects occupancy from two timestamped samples and clamps to capacity", () => {
    const snapshots = prepareAdvisorZones(inputs, 15);
    assert.equal(snapshots[0].zoneId, "zone-a");
    assert.equal(snapshots[0].trend, "rising");
    assert.equal(snapshots[0].predictedOccupancy, 1_000);
    assert.equal(snapshots[1].trend, "falling");
});

test("fallback advice is bounded, grounded, and explicitly non-AI", () => {
    const snapshots = prepareAdvisorZones(inputs, 15);
    const fallback = fallbackResourceAdvisor(snapshots, 15);
    assert.equal(fallback.source, "fallback");
    assert.equal(fallback.recommendations.length, 1);
    assert.equal(fallback.recommendations[0].urgency, "immediate");
    assert.match(fallback.recommendations[0].evidence, /projected 1000\/1000/);
    assert.match(fallback.recommendations[0].limitations, /2 volunteers/);
});

test("structured model output is accepted only for a supplied zone", () => {
    const snapshots = prepareAdvisorZones(inputs, 15);
    const fallback = fallbackResourceAdvisor(snapshots, 15);
    const valid = JSON.stringify({
        snapshotTime: "2026-07-18T12:10:00.000Z",
        recommendations: [
            {
                zoneId: "zone-a",
                zoneLabel: "ignored model label",
                venueName: "ignored model venue",
                action: "Stage a trained team for human approval.",
                rationale: "Projected pressure is highest here.",
                evidence: "Occupancy is 850/1000 and rising.",
                limitations: "No security roster was supplied.",
                urgency: "immediate",
                confidence: "high",
            },
        ],
    });
    const parsed = parseResourceAdvisor(valid, snapshots, fallback);
    assert.equal(parsed.source, "ai");
    assert.equal(parsed.recommendations[0].zoneLabel, "North Concourse");

    const unknownZone = valid.replace("zone-a", "zone-unknown");
    assert.equal(parseResourceAdvisor(unknownZone, snapshots, fallback), fallback);
});

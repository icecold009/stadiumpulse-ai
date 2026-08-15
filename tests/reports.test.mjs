import test from "node:test";
import assert from "node:assert/strict";
import { buildMatchSummary, matchSummaryCsv } from "../src/lib/reports/match-summary.ts";

const snapshot = {
    fetchedAt: "2026-08-15T12:00:00.000Z",
    selectedVenueId: "11111111-1111-4111-8111-111111111111",
    freshness: { state: "fresh", observedAt: "2026-08-15T11:59:00.000Z", ageSeconds: 60 },
    simulationLabel: "simulated",
    zones: [{
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        venueId: "11111111-1111-4111-8111-111111111111",
        label: "North",
        capacity: 100,
        occupancy: 96,
        occupancyPercent: 96,
        status: "critical",
        trend: "rising",
        freshness: { state: "fresh", observedAt: "2026-08-15T11:59:00.000Z", ageSeconds: 60 },
        recordedAt: "2026-08-15T11:59:00.000Z",
        openAlertCount: 1,
    }],
    gates: [{
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        venueId: "11111111-1111-4111-8111-111111111111",
        label: "Gate 1",
        currentScans: 120,
        previousScans: 100,
        changePercent: 20,
        trend: "rising",
        freshness: { state: "fresh", observedAt: "2026-08-15T11:59:00.000Z", ageSeconds: 60 },
        recordedAt: "2026-08-15T11:59:00.000Z",
    }],
    alerts: [],
};

test("match summary separates measured facts from deterministic analysis", () => {
    const summary = buildMatchSummary(snapshot, { id: snapshot.selectedVenueId, name: "North Stadium" });
    assert.equal(summary.dataStatus, "fresh");
    assert.equal(summary.measured.zones[0].occupancy, 96);
    assert.equal(summary.generatedAnalysis.priority, "critical");
    assert.equal(summary.generatedAnalysis.source, "deterministic-summary");
});

test("match summary CSV escapes and labels measured rows", () => {
    const summary = buildMatchSummary(snapshot, { id: snapshot.selectedVenueId, name: 'North "Stadium"' });
    const csv = matchSummaryCsv(summary);
    assert.match(csv, /"section","field","value","recorded_at"/);
    assert.match(csv, /"North ""Stadium"""/);
    assert.match(csv, /"measured_zone","North","96\/100/);
});

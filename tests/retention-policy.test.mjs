import test from "node:test";
import assert from "node:assert/strict";
import {
    COPILOT_QUERY_RETENTION_HOURS,
    copilotRetentionCutoff,
} from "../src/lib/maintenance/retention-policy.ts";

test("Copilot query retention uses the documented 24-hour window", () => {
    assert.equal(COPILOT_QUERY_RETENTION_HOURS, 24);
    assert.equal(
        copilotRetentionCutoff(new Date("2026-07-19T12:00:00.000Z")),
        "2026-07-18T12:00:00.000Z"
    );
});

test("Copilot retention rejects invalid windows", () => {
    for (const hours of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
        assert.throws(() => copilotRetentionCutoff(new Date(), hours));
    }
});

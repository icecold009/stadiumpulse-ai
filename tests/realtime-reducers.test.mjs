import test from "node:test";
import assert from "node:assert/strict";
import {
    mergeNewestById,
    upsertRealtimeRow,
} from "../src/lib/realtime/reducers.ts";

test("Realtime inserts replace duplicates, sort newest first, and respect limits", () => {
    const previous = [
        { id: 1, recorded_at: "2026-07-19T10:00:00.000Z", value: 1 },
        { id: 2, recorded_at: "2026-07-19T09:00:00.000Z", value: 2 },
    ];
    assert.deepEqual(
        mergeNewestById(
            previous,
            { id: 2, recorded_at: "2026-07-19T11:00:00.000Z", value: 3 },
            2
        ),
        [
            { id: 2, recorded_at: "2026-07-19T11:00:00.000Z", value: 3 },
            { id: 1, recorded_at: "2026-07-19T10:00:00.000Z", value: 1 },
        ]
    );
});

test("Realtime updates replace matching alert and volunteer state", () => {
    const previous = [{ id: "row-1", status: "open", message: "Keep me" }];
    assert.deepEqual(
        upsertRealtimeRow(previous, { id: "row-1", status: "handled" }),
        [{ id: "row-1", status: "handled", message: "Keep me" }]
    );
});

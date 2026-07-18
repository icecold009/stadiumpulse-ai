import test from "node:test";
import assert from "node:assert/strict";
import {
    parseAlertAction,
    parseCopilotQuestion,
    parseVolunteerZoneId,
    UUID_PATTERN,
} from "../src/lib/api/contracts.ts";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

test("validates UUID route parameters strictly", () => {
    assert.equal(UUID_PATTERN.test(uuid), true);
    for (const value of ["", "123", "../../etc/passwd", `${uuid}extra`]) {
        assert.equal(UUID_PATTERN.test(value), false);
    }
});

test("normalizes bounded Copilot questions", () => {
    assert.deepEqual(parseCopilotQuestion({ question: "  Which zone?  " }), {
        ok: true,
        value: "Which zone?",
    });
    for (const body of [{}, null, { question: 42 }, { question: "   " }, { question: "x".repeat(501) }]) {
        assert.equal(parseCopilotQuestion(body).ok, false);
    }
});

test("accepts only documented alert actions", () => {
    for (const action of ["accept", "reject", "handled"]) {
        assert.deepEqual(parseAlertAction({ action }), { ok: true, value: action });
    }
    for (const action of ["handle", "delete", "ACCEPT", true, undefined]) {
        assert.equal(parseAlertAction({ action }).ok, false);
    }
});

test("validates volunteer reassignment destinations", () => {
    assert.deepEqual(parseVolunteerZoneId({ zoneId: uuid }), { ok: true, value: uuid });
    assert.deepEqual(parseVolunteerZoneId({ zoneId: null }), { ok: true, value: null });
    for (const body of [{}, { zoneId: "zone-a" }, { zoneId: 1 }, null]) {
        assert.equal(parseVolunteerZoneId(body).ok, false);
    }
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
const code = ts.transpileModule(fs.readFileSync("src/lib/event-lifecycle.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { exports });
const { hasEventFinished } = exports;

const raceDay = new Date(2026, 10, 10, 12);
const event = { date: "2026-11-09", endDate: "2026-11-10", status: "closed" };

test("a completed event is eligible for leaderboard export", () => {
  assert.equal(hasEventFinished({ ...event, status: "completed" }, raceDay), true);
});

test("a scheduled event finishes after its last day, with the race date as a fallback", () => {
  assert.equal(hasEventFinished(event, raceDay), false);
  assert.equal(hasEventFinished(event, new Date(2026, 10, 11)), true);
  assert.equal(hasEventFinished({ ...event, endDate: null }, raceDay), true);
});

test("unapproved or cancelled events do not qualify even after their scheduled dates", () => {
  for (const status of ["draft", "pending", "rejected", "cancelled", "suspended"]) {
    assert.equal(hasEventFinished({ ...event, status }, new Date(2026, 10, 11)), false);
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(
  fs.readFileSync("src/lib/dashboard.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;
const exports = {};
vm.runInNewContext(code, { exports, Intl, Date });
const { recentRange, rangeError, dateLabel } = exports;

test("default range follows Vietnam midnight, includes 30 days across year boundary", () => {
  const range = recentRange(30, new Date("2026-12-31T17:30:00Z"));
  assert.equal(range.to, "2027-01-01");
  assert.equal(range.from, "2026-12-03");
});
test("range validation rejects missing, invalid, reversed and overlong dates", () => {
  for (const range of [
    { from: "", to: "2026-01-01" },
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026-12-01", to: "2026-01-01" },
    { from: "2025-01-01", to: "2026-01-02" },
    { from: "1899-01-01", to: "1899-01-02" },
  ])
    assert.equal(typeof rangeError(range), "string");
});
test("same day and inclusive leap-year range are valid", () => {
  assert.equal(rangeError({ from: "2024-02-29", to: "2024-02-29" }), null);
  assert.equal(rangeError({ from: "2024-01-01", to: "2024-12-31" }), null);
  assert.equal(dateLabel("2024-02-29"), "29/02/2024");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(path.resolve("src/lib/race-map/geo.ts"), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const geo = {};
vm.runInNewContext(code, { exports: geo });

test("runner reaches the checkpoint marker at its course km even when the polyline is longer", () => {
  const route = [{ lat: 21.0285, lng: 105.8542 }, { lat: 21.068, lng: 105.894 }];
  const eventDistanceKm = 5;
  assert(geo.polylineLengthKm(route) > eventDistanceKm);

  for (const checkpointKm of [1.25, 2.5, 3.75, 5]) {
    const marker = geo.pointAtKmAlongPolyline(route, checkpointKm);
    const runner = geo.positionAtCourseKm(route, checkpointKm);
    assert(geo.haversineKm(runner, marker) < 0.001, `checkpoint ${checkpointKm} km`);
  }
});

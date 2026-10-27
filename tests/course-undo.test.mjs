import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

// Exercise the provider's public actions without a browser or live map services.
async function editor({ routeRequest } = {}) {
  const hooks = [];
  const effects = [];
  const modules = new Map();
  const saves = [];
  let cursor = 0;
  let dirty = true;
  let current;
  const changed = (before, after) => !before || before.length !== after.length || after.some((value, index) => !Object.is(value, before[index]));
  const memo = (factory, deps) => {
    const index = cursor++;
    if (!hooks[index] || changed(hooks[index].deps, deps)) hooks[index] = { value: factory(), deps };
    return hooks[index].value;
  };
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useState(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { value: typeof initial === "function" ? initial() : initial };
      return [hooks[index].value, (update) => {
        const value = typeof update === "function" ? update(hooks[index].value) : update;
        if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; dirty = true; }
      }];
    },
    useRef: (initial) => memo(() => ({ current: initial }), []),
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useEffect(effect, deps) {
      const index = cursor++;
      if (!hooks[index] || changed(hooks[index].deps, deps)) {
        const previous = hooks[index];
        hooks[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => {
          hooks[index].cleanup?.();
          hooks[index].cleanup = effect();
        });
      }
    },
  };
  let courses;
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const source = fs.readFileSync(file, "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { exports, require(id) {
      if (id === "react") return react;
      if (id === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
      if (id === "@/api/events") return { getEventById: async () => ({ distances: [{ id: "short", name: "5K" }, { id: "long", name: "10K" }] }) };
      if (id === "@/api/race-map") return {
        getEventCourse: async (_event, distance) => structuredClone(courses[distance]),
        hasEventCourse: async () => true,
        saveEventCourse: async (_event, distance, course) => { saves.push({ distance, course }); return course; },
      };
      if (id === "@/lib/race-map/osrm") return { fetchOsrmRoute: routeRequest ?? (async () => ({ polyline: courses.short.polyline, distanceKm: courses.short.distanceKm })) };
      if (id === "@/lib/toast") return { toastError() {}, toastInfo() {}, toastSuccess() {} };
      if (id.startsWith("@/")) {
        const base = path.resolve("src", id.slice(2));
        return load(fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`);
      }
      throw new Error(`Unexpected dependency: ${id}`);
    } });
    return exports;
  }
  const course = load(path.resolve("src/lib/race-map/course.ts"));
  courses = {
    short: { ...course.createDefaultCourse("short"), title: "Short course" },
    long: { ...course.createDefaultCourse("long"), title: "Long course" },
  };
  const { CourseProvider } = load(path.resolve("src/components/organizer/race-map/CourseContext.tsx"));
  async function flush() {
    for (let pass = 0; pass < 30; pass++) {
      if (dirty) {
        dirty = false;
        cursor = 0;
        current = CourseProvider({ eventId: "event", children: null }).props.value;
      }
      while (effects.length) effects.shift()();
      await new Promise(setImmediate);
      if (!dirty && !effects.length) return;
    }
    throw new Error("Editor did not settle");
  }
  await flush();
  return { get current() { return current; }, flush, saves, courses };
}

test("undo starts disabled and ignores edits that change nothing", async () => {
  const map = await editor();
  assert.equal(map.current.canUndo, false);
  map.current.setTitle(map.current.draft.title);
  map.current.undo();
  await map.flush();
  assert.equal(map.current.canUndo, false);
});

test("undo restores both a checkpoint name and its editable draft without saving", async () => {
  const map = await editor();
  const checkpoint = map.current.cpDrafts.find((cp) => cp.km > 0 && cp.km < map.current.draft.distanceKm);
  assert(checkpoint);
  const before = JSON.stringify(map.current.draft);
  const saves = map.saves.length;
  map.current.renameCheckpoint(checkpoint.km, "Updated checkpoint");
  await map.flush();
  assert.equal(map.current.canUndo, true);
  map.current.undo();
  await map.flush();
  assert.equal(JSON.stringify(map.current.draft), before);
  assert.equal(map.current.cpDrafts.find((cp) => cp.km === checkpoint.km).name, checkpoint.name);
  assert.equal(map.saves.length, saves);
  assert.equal(map.current.canUndo, false);
});

test("undo restores a removed checkpoint", async () => {
  const map = await editor();
  const checkpoint = map.current.cpDrafts.find((cp) => cp.km > 0 && cp.km < map.current.draft.distanceKm);
  const before = JSON.stringify(map.current.draft);
  map.current.removeMidCheckpoint(checkpoint.km);
  await map.flush();
  assert(!map.current.draft.checkpoints.some((cp) => cp.km === checkpoint.km));
  map.current.undo();
  await map.flush();
  assert.equal(JSON.stringify(map.current.draft), before);
});

test("undo walks back a new route, a pending start, and clearing the map", async () => {
  const map = await editor();
  const before = JSON.stringify(map.current.draft);
  const [start, finish] = [map.current.draft.waypoints[0], map.current.draft.waypoints.at(-1)];
  map.current.clearCourse();
  await map.flush();
  assert.equal(map.current.draft.polyline.length, 0);
  await map.current.handleMapClick(start);
  await map.flush();
  assert.equal(map.current.startEndPhase, "need-end");
  await map.current.handleMapClick(finish);
  await map.flush();
  assert.equal(map.current.startEndPhase, "ready");
  map.current.undo();
  await map.flush();
  assert.equal(map.current.startEndPhase, "need-end");
  map.current.undo();
  await map.flush();
  assert.equal(map.current.startEndPhase, "need-start");
  map.current.undo();
  await map.flush();
  assert.equal(JSON.stringify(map.current.draft), before);
  assert.equal(map.current.canUndo, false);
});

test("switching distance clears undo history", async () => {
  const map = await editor();
  map.current.clearCourse();
  await map.flush();
  assert.equal(map.current.canUndo, true);
  await map.current.selectDistance("long");
  await map.flush();
  assert.equal(map.current.canUndo, false);
  map.current.undo();
  await map.flush();
  assert.equal(map.current.draft.distanceId, "long");
  assert.equal(map.current.draft.title, "Long course");
});

test("failed route requests leave the course and undo history unchanged", async () => {
  const map = await editor({ routeRequest: async () => { throw new Error("Routing unavailable"); } });
  const before = JSON.stringify(map.current.draft);
  await map.current.moveWaypoint(0, { lat: 16, lng: 108 });
  await map.flush();
  assert.equal(JSON.stringify(map.current.draft), before);
  assert.equal(map.current.canUndo, false);
});

test("undo is disabled during snapping and stale results cannot overwrite another distance", async () => {
  let finishRoute;
  const pendingRoute = new Promise((resolve) => { finishRoute = resolve; });
  const map = await editor({ routeRequest: () => pendingRoute });
  map.current.setTitle("Edited title");
  await map.flush();
  const request = map.current.moveWaypoint(0, { lat: 16, lng: 108 });
  await map.flush();
  assert.equal(map.current.canUndo, false);
  map.current.undo();
  await map.flush();
  assert.equal(map.current.draft.title, "Edited title");
  await map.current.selectDistance("long");
  await map.flush();
  finishRoute({ polyline: map.courses.short.polyline, distanceKm: 5 });
  await request;
  await map.flush();
  assert.equal(map.current.draft.distanceId, "long");
  assert.equal(map.current.draft.title, "Long course");
  assert.equal(map.current.canUndo, false);
});

test("undo retains the most recent fifty edits", async () => {
  const map = await editor();
  for (let index = 1; index <= 55; index++) {
    map.current.setTitle(`Course ${index}`);
    await map.flush();
  }
  for (let index = 0; index < 50; index++) {
    map.current.undo();
    await map.flush();
  }
  assert.equal(map.current.draft.title, "Course 5");
  assert.equal(map.current.canUndo, false);
});

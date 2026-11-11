import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, require: id => {
    if (id in dependencies) return dependencies[id];
    throw new Error(`Unexpected dependency: ${id}`);
  } });
  return exports;
}
const role = load("src/lib/role.ts", { "@/interfaces/role": load("src/interfaces/role.ts") });
const permissions = load("src/lib/route-permissions.ts");

test("staff role aliases share the checkpoint workspace permission", () => {
  for (const name of ["Race-staff", "RaceStaff", "ROLE_VOLUNTEER", "Coordinator"])
    assert.equal(role.mapAppRole(name), "RACE-STAFF");
  assert.equal(permissions.routePermission("/staff/events/event/checkpoint")[0], "RACE-STAFF");
  assert.equal(permissions.routePermission("/staffing"), null);
});

async function route(path, user) {
  const { proxy } = load("src/proxy.ts", {
    "next/server": { NextResponse: { next: () => "next", redirect: url => url.pathname + url.search } },
    "@/lib/server-auth": { userForRequest: async () => user },
    "@/lib/route-permissions": permissions,
    "@/lib/role": role,
  });
  const url = new URL(path, "http://localhost:3000");
  return proxy({ nextUrl: url, url: url.href });
}

test("staff landing and access depend on the verified account", async () => {
  const staff = { roleName: "Race-staff" };
  assert.equal(await route("/", staff), "/staff");
  assert.equal(await route("/login", staff), "/staff");
  assert.equal(await route("/staff/events/event/checkpoint", staff), "next");
  assert.equal(await route("/staff", { roleName: "Runner" }), "/403");
  assert.equal(await route("/staff", { roleName: "Organizer" }), "/403");
  assert.equal(await route("/staff", null), "/login?from=%2Fstaff");
  assert.equal(await route("/", null), "next");
});

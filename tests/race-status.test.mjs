import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require(id) {
      if (id in dependencies) return dependencies[id];
      throw new Error(`Unexpected dependency: ${id}`);
    },
    ...globals,
  });
  return exports;
}

const raceStatus = load("src/lib/race-status.ts");
const format = load("src/lib/format.ts", { "@/lib/race-status": raceStatus });

test("DNS/DNF/DQ override confirmed/finished display without mutating registration status", () => {
  for (const status of ["confirmed", "finished"]) {
    for (const terminal of ["dns", "dnf", "dq"]) {
      const registration = { status, raceStatus: terminal };
      assert.equal(raceStatus.getRegistrationDisplayStatus(registration), terminal);
      assert.match(format.getRegistrationStatusLabel(status, terminal), new RegExp(terminal.toUpperCase()));
      assert.doesNotMatch(format.getRegistrationStatusLabel(status, terminal), /Đã hoàn thành|Đã đăng ký/);
      assert.doesNotMatch(format.getRegistrationStatusColor(status, terminal), /emerald/);
      assert.equal(registration.status, status);
    }
  }
});

test("payment, approval, rejection and cancellation labels retain workflow meaning", () => {
  for (const status of ["pending_payment", "pending_approval", "rejected", "cancelled"]) {
    assert.equal(format.getRegistrationStatusLabel(status, "dq"), format.getRegistrationStatusLabel(status));
    assert.equal(raceStatus.hasFinishedRace({ status, raceStatus: "finished" }), false);
  }
  assert.equal(format.getRegistrationStatusLabel("confirmed", "not_started"), "Đã đăng ký");
  assert.equal(format.getRegistrationStatusLabel("confirmed", "running"), "Đang chạy");
});

test("certificate and finished filter accept only valid finishes, including legacy responses", () => {
  const rows = [
    { id: "legacy", status: "finished" },
    { id: "valid", status: "finished", raceStatus: "finished" },
    { id: "dq", status: "finished", raceStatus: "dq", bibNumber: "1001" },
    { id: "dns", status: "confirmed", raceStatus: "dns", bibNumber: "1002" },
    { id: "dnf", status: "confirmed", raceStatus: "dnf", bibNumber: "1003" },
    { id: "running", status: "confirmed", raceStatus: "running" },
    { id: "unstarted", status: "confirmed", raceStatus: "not_started" },
  ];
  assert.deepEqual(rows.filter(raceStatus.hasFinishedRace).map(x => x.id), ["legacy", "valid"]);
  assert.equal(format.getRegistrationStatusLabel("finished"), "Đã hoàn thành");
});

test("registration API preserves raceStatus separately from status", async () => {
  const row = { id: "reg1", status: "finished", raceStatus: "dq", distanceLabel: "10K" };
  const service = load("src/api/events.ts", {
    "@/config/axios": { get: async () => row },
    "@/lib/media-url": { resolveStoredFileUrl: x => x },
  });
  const result = await service.getRegistrationById("reg1");
  assert.equal(result.status, "finished");
  assert.equal(result.raceStatus, "dq");
  assert.equal(result.distanceName, "10K");
});

const lifecycle = load("src/lib/event-lifecycle.ts");
const Icon = () => null;
const { default: EventCard } = load("src/components/events/EventCard.tsx", {
  "react": React,
  "react/jsx-runtime": jsxRuntime,
  "next/link": ({ children, ...props }) => React.createElement("a", props, children),
  "next/image": () => null,
  "lucide-react": { Calendar: Icon, MapPin: Icon, Users: Icon, TrendingUp: Icon, ArrowUpRight: Icon },
  "@/lib/format": format,
  "@/lib/event-lifecycle": lifecycle,
  "@/lib/media-url": { mediaDisplayUrl: x => x },
  "@/lib/race-status": raceStatus,
});

test("DQ event card renders the decision and preserves the ticket link", () => {
  const html = renderToStaticMarkup(React.createElement(EventCard, {
    event: { id: "event1", name: "Test Run", status: "completed", date: "2026-11-03", distances: [] },
    statusMode: "registration", myRegistrationStatus: "finished", myRaceStatus: "dq", registrationId: "reg1",
  }));
  assert.match(html, /DQ · Truất quyền thi đấu/);
  assert.doesNotMatch(html, /Đã hoàn thành/);
  assert.match(html, /href="\/my-registrations\/reg1"/);
});

const normalize = load("src/lib/leaderboard.ts", {
  "@/lib/distance-types": { normalizeDistanceType: () => "OTHER" },
});
function leaderboardService(get) {
  return load("src/api/leaderboards.ts", {
    "axios": { isAxiosError: () => false },
    "@/config/axios": { get },
    "@/lib/leaderboard": normalize,
  }, {
    // A previous deployment may still have 24-hour cached pages in localStorage.
    window: { localStorage: { getItem: () => { throw new Error("Stale browser cache must not be read"); } } },
  });
}

test("leaderboard refetches after DQ and on a page reload despite old browser cache", async () => {
  let rows = [{ bib: "1001", rank: 1 }];
  let requests = 0;
  const get = async () => { requests++; return { items: rows, totalCount: rows.length }; };
  const service = leaderboardService(get);
  assert.equal((await service.getEventLeaderboard("event1", "10k")).items.length, 1);
  rows = [];
  assert.equal((await service.getEventLeaderboard("event1", "10k")).items.length, 0);
  assert.equal((await leaderboardService(get).getEventLeaderboard("event1", "10k")).items.length, 0);
  assert.equal(requests, 3);
});

test("concurrent identical leaderboard requests share work but a later request is fresh", async () => {
  let resolve;
  let requests = 0;
  const response = new Promise(done => { resolve = done; });
  const service = leaderboardService(() => { requests++; return response; });
  const first = service.getEventLeaderboard("event1", "10k");
  const second = service.getEventLeaderboard("event1", "10k");
  assert.equal(requests, 1);
  resolve({ items: [], totalCount: 0 });
  await Promise.all([first, second]);
  await service.getEventLeaderboard("event1", "10k");
  assert.equal(requests, 2);
});

test("failed leaderboard requests can be retried", async () => {
  let requests = 0;
  const service = leaderboardService(async () => {
    if (++requests === 1) throw new Error("Network error");
    return { items: [], totalCount: 0 };
  });
  await assert.rejects(service.getEventLeaderboard("event1", "10k"), /Network error/);
  assert.equal((await service.getEventLeaderboard("event1", "10k")).items.length, 0);
});

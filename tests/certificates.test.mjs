import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require(id) {
      if (id in dependencies) return dependencies[id];
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return exports;
}

const certificate = {
  registrationId: "11111111-1111-4111-8111-111111111111",
  runnerName: "Nguyễn Văn A", eventName: "RaceDay Test", bib: "001001",
  distance: "10K · 10 km", raceDate: "2026-10-27", status: "finished",
  finishTime: "01:02:03", resultSeconds: 3723, finishedAtUtc: "2026-10-27T08:00:00Z",
  startedAtUtc: "2026-10-27T06:57:57Z", distanceKm: 10, pace: "06:12",
};

function service(get) {
  return load("src/api/events.ts", {
    "@/config/axios": { get },
    "@/lib/media-url": { resolveStoredFileUrl: (value) => value },
  });
}

test("certificate data comes from the registration certificate endpoint in one request", async () => {
  const urls = [];
  const api = service(async (url) => { urls.push(url); return certificate; });

  const result = await api.getRegistrationCertificate(certificate.registrationId);

  assert.deepEqual(urls, [`api/v1/event/registrations/${certificate.registrationId}/certificate`]);
  assert.equal(result, certificate);
  assert.equal(result.bib, "001001");
  assert.equal(result.finishTime, "01:02:03");
  assert.equal(result.pace, "06:12");
});

test("an unfinished response stays false without fetching fallback certificate data", async () => {
  let requests = 0;
  const api = service(async () => { requests += 1; return false; });

  assert.equal(await api.getRegistrationCertificate(certificate.registrationId), false);
  assert.equal(requests, 1);
});

test("certificate permission and network errors are propagated to the page", async () => {
  for (const error of [new Error("Network Error"), { response: { status: 400, data: { message: "Bạn không có quyền xem chứng nhận của đăng ký này." } } }]) {
    const api = service(async () => { throw error; });
    await assert.rejects(api.getRegistrationCertificate(certificate.registrationId), (caught) => caught === error);
  }
});

test("certificate artwork includes finish time, pace, and completion wording", () => {
  const { drawParticipationCertificate } = load("src/lib/certificate-canvas.ts");
  const texts = [];
  const context = new Proxy({}, {
    get(_target, property) {
      if (property === "fillText") return (value) => texts.push(value);
      if (property === "measureText") return (value) => ({ width: value.length * 12 });
      return () => {};
    },
  });
  const canvas = { getContext: () => context };

  drawParticipationCertificate(canvas, { ...certificate, status: "Đã hoàn thành" }, "Inter");

  assert(texts.some((text) => text.includes("01:02:03")));
  assert(texts.some((text) => text.includes("Pace trung bình: 06:12 phút/km")));
  assert(texts.some((text) => text.includes("đã hoàn thành cự ly")));
  assert(texts.includes("001001"));
  assert(!texts.some((text) => text.includes("đã đăng ký tham gia")));
});

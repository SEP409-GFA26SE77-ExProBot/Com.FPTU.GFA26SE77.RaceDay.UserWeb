import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports, URL, URLSearchParams,
    require(id) { if (id in dependencies) return dependencies[id]; throw new Error(`Unexpected dependency: ${id}`); },
  });
  return exports;
}

const helpers = load("src/lib/complaints.ts");
const permissions = load("src/lib/route-permissions.ts");
const complaint = {
  id: "11111111-1111-4111-8111-111111111111", eventId: "22222222-2222-4222-8222-222222222222",
  eventName: "Test Run", distanceId: "33333333-3333-4333-8333-333333333333", distanceName: "10K",
  userId: "44444444-4444-4444-8444-444444444444", title: "Timing issue", content: "Incorrect time",
  evidenceLinks: ["https://example.com/proof"], status: "pending", processingStatus: "unprocessed",
  responseContent: null, createdAtUtc: "2026-10-28T08:00:00Z", repliedAtUtc: null,
};

function api() {
  const calls = [];
  const client = {
    get: async (url, options) => {
      calls.push({ method: "GET", url, ...options });
      return url.endsWith("/detail") ? complaint : { items: [complaint], page: 1, pageSize: 10, totalCount: 1 };
    },
    post: async (url, body) => { calls.push({ method: "POST", url, body }); return { ...complaint, status: "accepted", responseContent: "Verified" }; },
  };
  return { calls, ...load("src/api/complaints.ts", { "@/config/axios": client, "@/lib/complaints": helpers }) };
}

test("runner history requests all events and statuses with server pagination", async () => {
  const service = api();
  const result = await service.getMyComplaints(2, 10);
  const call = service.calls[0];
  assert.equal(call.url, "api/v1/event/complaints/mine");
  assert.equal(call.params.page, 2);
  assert.equal(call.params.pageSize, 10);
  assert(!("eventId" in call.params));
  assert(!("status" in call.params));
  assert.equal(result.items[0].status, "Pending");
});

test("organizer filters are sent to the organizer complaints endpoint", async () => {
  const service = api();
  await service.getOrganizerComplaints({ eventId: complaint.eventId, status: "Rejected", page: 3, pageSize: 20, fromDate: "2026-10-01T00:00:00Z" });
  assert.equal(service.calls[0].url, "api/v1/event/organizer/complaints");
  assert.equal(service.calls[0].params.eventId, complaint.eventId);
  assert.equal(service.calls[0].params.status, "Rejected");
  assert.equal(service.calls[0].params.page, 3);
});

test("both detail views fetch by complaintId and retain organizer responseContent", async () => {
  const service = api();
  const result = await service.getComplaintDetail(complaint.id);
  assert.equal(service.calls[0].url, "api/v1/event/complaints/detail");
  assert.equal(service.calls[0].params.complaintId, complaint.id);
  assert("responseContent" in result);
});

test("creation posts event, distance, title, content and evidence to the complaint API", async () => {
  const service = api();
  const body = { eventId: complaint.eventId, distanceId: complaint.distanceId, title: complaint.title, content: complaint.content, evidenceLinks: complaint.evidenceLinks };
  await service.createComplaint(body);
  assert.equal(service.calls[0].url, "api/v1/event/complaints");
  assert.equal(service.calls[0].body, body);
});

test("reply sends the decision and required response and normalizes returned status", async () => {
  const service = api();
  const result = await service.replyToComplaint(complaint.id, { decision: "Accepted", responseContent: "Verified" });
  assert.equal(service.calls[0].url, `api/v1/event/organizer/complaints/${complaint.id}/reply`);
  assert.equal(service.calls[0].body.responseContent, "Verified");
  assert.equal(service.calls[0].body.decision, "Accepted");
  assert.equal(result.status, "Accepted");
  assert.equal(result.responseContent, "Verified");
});

test("status normalization supports the API's mixed casing", () => {
  for (const status of ["Pending", "Accepted", "Rejected"]) {
    assert.equal(helpers.normalizeComplaintStatus(status.toLowerCase()), status);
    assert.equal(helpers.normalizeComplaintStatus(status), status);
  }
  assert.throws(() => helpers.normalizeComplaintStatus("open"));
});

test("creation requires one to five valid evidence links", () => {
  const input = { title: "Title", content: "Content", evidenceLinks: ["https://example.com/proof"] };
  assert.equal(helpers.complaintFormError(input), null);
  assert.equal(helpers.complaintFormError({ ...input, evidenceLinks: ["https://example.com/proof", "", "", "", ""] }), null);
  assert(helpers.complaintFormError({ ...input, evidenceLinks: ["", " ", "", "", ""] }));
  assert(helpers.complaintFormError({ ...input, evidenceLinks: Array(6).fill("https://example.com") }));
  assert(helpers.complaintFormError({ ...input, evidenceLinks: ["javascript:alert(1)"] }));
});

test("title and content reject empty whitespace and oversized values", () => {
  const input = { title: "Title", content: "Content", evidenceLinks: ["https://example.com/proof"] };
  assert(helpers.complaintFormError({ ...input, title: " " }));
  assert(helpers.complaintFormError({ ...input, title: "x".repeat(201) }));
  assert(helpers.complaintFormError({ ...input, content: " " }));
  assert(helpers.complaintFormError({ ...input, content: "x".repeat(2001) }));
});

test("evidence links allow HTTP(S) and block executable or local URLs", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,test", "file:///C:/secret", "ftp://example.com", "//example.com", ""]) assert.equal(helpers.safeEvidenceUrl(value), null);
  assert.equal(helpers.safeEvidenceUrl(" https://example.com/proof "), "https://example.com/proof");
});

test("detail links preserve complaint identity and organizer event context", () => {
  const runner = new URL(helpers.complaintDetailHref(complaint.id), "https://example.com");
  assert.equal(runner.pathname, "/disputes/detail");
  assert.equal(runner.searchParams.get("complaintId"), complaint.id);
  const organizer = new URL(helpers.complaintDetailHref(complaint.id, complaint.eventId, true), "https://example.com");
  assert.equal(organizer.pathname, "/organizer/disputes/resolve");
  assert.equal(organizer.searchParams.get("eventId"), complaint.eventId);
});

test("new creation and detail routes require an authenticated session", () => {
  assert.equal(permissions.routePermission(`/dispute/${complaint.eventId}`), "*");
  assert.equal(permissions.routePermission("/disputes/detail"), "*");
  assert.equal(permissions.routePermission("/organizer/disputes/resolve"), "*");
});

test("malformed or missing complaint IDs cannot trigger a detail request", () => {
  for (const value of ["", "invalid", "00000000-0000-0000-0000-000000000000"]) assert.equal(helpers.isComplaintId(value), false);
  assert.equal(helpers.isComplaintId(complaint.id), true);
});

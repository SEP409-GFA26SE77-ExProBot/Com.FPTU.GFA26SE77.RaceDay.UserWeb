import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
const code = ts.transpileModule(fs.readFileSync("src/lib/certificate-pdf.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { exports, TextEncoder, Uint8Array });
const { createCertificatePdf, certificateFileName } = exports;
// Include binary bytes and newlines to detect character-count versus byte-offset mistakes.
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x0a, 0x80, 0x0d, 0xff, 0xd9]);

test("certificate export creates exactly one landscape A4 page containing only its image", () => {
  const bytes = createCertificatePdf(jpeg, 2400, 1697);
  const pdf = Buffer.from(bytes).toString("latin1");
  assert(pdf.startsWith("%PDF-1.4\n"));
  assert.match(pdf, /\/MediaBox \[0 0 841\.89 595\.28\]/);
  assert.match(pdf, /\/Type \/Pages \/Kids \[3 0 R\] \/Count 1/);
  assert.equal((pdf.match(/\/Type \/Page\b/g) || []).length, 1);
  assert.equal((pdf.match(/\/Subtype \/Image\b/g) || []).length, 1);
  const imageStart = pdf.indexOf("stream\n") + "stream\n".length;
  assert.deepEqual(bytes.slice(imageStart, imageStart + jpeg.length), jpeg);
  assert.match(pdf, /\/Length 10 >>\nstream/);
  assert.match(pdf, /\/Certificate Do/);
  assert.doesNotMatch(pdf, /<html|<header|<footer|localhost|\/URI\b/);
});

test("the PDF cross-reference table resolves every object after the binary image", () => {
  const bytes = createCertificatePdf(jpeg, 2400, 1697);
  const pdf = Buffer.from(bytes).toString("latin1");
  const xref = Number(pdf.match(/startxref\n(\d+)\n%%EOF/)[1]);
  assert.equal(pdf.slice(xref, xref + 4), "xref");
  const entries = pdf.slice(xref).split("\n").slice(3, 8);
  entries.forEach((entry, index) => {
    const offset = Number(entry.slice(0, 10));
    assert.equal(pdf.slice(offset, offset + 7), `${index + 1} 0 obj`);
  });
});

test("invalid image data and dimensions fail instead of downloading a corrupt PDF", () => {
  assert.throws(() => createCertificatePdf(new Uint8Array([1, 2, 3]), 2400, 1697), /ảnh chứng nhận/);
  for (const width of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => createCertificatePdf(jpeg, width, 1697), /Kích thước/);
  }
  assert.throws(() => createCertificatePdf(jpeg, 2400, 0), /Kích thước/);
});

test("Vietnamese names produce readable filenames and BIB leading zeroes survive", () => {
  assert.equal(certificateFileName("Đào Mỹ Quỳnh", "001302"), "chung-nhan-dao-my-quynh-001302.pdf");
  const fileName = certificateFileName("../../Hà <script>", "../../001");
  assert.match(fileName, /^chung-nhan-[a-z0-9-]+\.pdf$/);
  assert.equal(certificateFileName("", ""), "chung-nhan-van-dong-vien-raceday.pdf");
});

const fs = require("fs");
const p = "src/data/mock-events.ts";
let s = fs.readFileSync(p, "utf8");
const slugs = [...s.matchAll(/slug: "([^"]+)"/g)].map((x) => x[1]);
for (const slug of slugs) {
  const hasBanner = new RegExp(
    `slug: "${slug}"[\\s\\S]{0,900}bannerImage:`
  ).test(s);
  if (hasBanner) continue;
  const re = new RegExp(
    `(slug: "${slug}"[\\s\\S]*?bannerEmoji: "[^"]+",)(\\r?\\n)(\\s*)`
  );
  s = s.replace(
    re,
    `$1$2$3bannerImage: "/events/${slug}.jpg",$2$3`
  );
}
fs.writeFileSync(p, s);
console.log("bannerImage count", (s.match(/bannerImage:/g) || []).length);

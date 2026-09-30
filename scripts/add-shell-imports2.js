const fs = require("fs");
const files = [
  "src/app/(main)/events/[id]/confirmation/page.tsx",
  "src/app/(main)/events/[id]/payment/page.tsx",
  "src/app/(main)/events/[id]/register/page.tsx",
  "src/app/(main)/photos/page.tsx",
  "src/app/(main)/profile/edit/page.tsx",
  "src/app/(main)/profile/page.tsx",
  "src/app/(main)/results/[eventId]/page.tsx",
  "src/app/(main)/results/page.tsx",
];

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  if (s.includes("@/lib/page-shell")) {
    console.log("skip", f);
    continue;
  }
  const names = [];
  if (s.includes("PAGE_SHELL_FORM")) names.push("PAGE_SHELL_FORM");
  if (s.includes("${PAGE_SHELL}") || s.includes("{PAGE_SHELL}") || /PAGE_SHELL(?!_)/.test(s))
    names.unshift("PAGE_SHELL");
  const uniq = [...new Set(names)];
  if (!uniq.length) uniq.push("PAGE_SHELL");
  const line = `import { ${uniq.join(", ")} } from "@/lib/page-shell";\n`;
  if (s.startsWith('"use client"')) {
    s = s.replace(/^"use client";\r?\n/, `"use client";\n\n${line}`);
  } else {
    s = line + s;
  }
  fs.writeFileSync(f, s);
  console.log("ok", f, uniq.join(","));
}

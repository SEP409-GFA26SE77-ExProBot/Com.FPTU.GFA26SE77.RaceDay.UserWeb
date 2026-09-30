const fs = require("fs");
const files = [
  ["src/app/(main)/events/[id]/confirmation/page.tsx", "PAGE_SHELL_FORM"],
  ["src/app/(main)/events/[id]/payment/page.tsx", "PAGE_SHELL_FORM"],
  ["src/app/(main)/events/[id]/register/page.tsx", "PAGE_SHELL_FORM"],
  ["src/app/(main)/photos/page.tsx", "PAGE_SHELL"],
  ["src/app/(main)/profile/edit/page.tsx", "PAGE_SHELL_FORM"],
  ["src/app/(main)/profile/page.tsx", "PAGE_SHELL_FORM"],
  ["src/app/(main)/results/[eventId]/page.tsx", "PAGE_SHELL"],
  ["src/app/(main)/results/page.tsx", "PAGE_SHELL"],
];

for (const [f, name] of files) {
  let s = fs.readFileSync(f, "utf8");
  if (s.includes("@/lib/page-shell")) {
    console.log("has import", f);
    continue;
  }
  const line = `import { ${name} } from "@/lib/page-shell";\n`;
  if (s.startsWith('"use client"')) {
    s = s.replace('"use client";\n', '"use client";\n\n' + line);
  } else {
    s = line + s;
  }
  fs.writeFileSync(f, s);
  console.log("added", f);
}

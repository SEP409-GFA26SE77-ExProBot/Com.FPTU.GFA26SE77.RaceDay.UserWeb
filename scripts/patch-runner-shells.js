const fs = require("fs");

const replacements = [
  [/className="mx-auto max-w-xl px-4 sm:px-6 py-8/g, 'className={`${PAGE_SHELL_FORM} max-w-2xl py-7'],
  [/className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8/g, 'className={`${PAGE_SHELL_FORM} max-w-3xl py-7'],
  [/className="mx-auto max-w-3xl px-4 sm:px-6 py-8/g, 'className={`${PAGE_SHELL_FORM} max-w-3xl py-7'],
  [/className="mx-auto max-w-3xl px-4 sm:px-6 py-10/g, 'className={`${PAGE_SHELL_FORM} max-w-3xl py-8'],
  [/className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8/g, 'className={`${PAGE_SHELL} py-7'],
  [/className="mx-auto w-full max-w-\[1400px\] px-4 sm:px-6 lg:px-8 py-7/g, 'className={`${PAGE_SHELL} py-7'],
  [/className="mx-auto w-full max-w-\[1100px\] px-4 sm:px-6 lg:px-8 py-7/g, 'className={`${PAGE_SHELL_FORM} py-7'],
  [/className="mx-auto max-w-lg px-4 py-16/g, 'className={`${PAGE_SHELL_FORM} max-w-lg py-14'],
  [/className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8/g, 'className={`relative ${PAGE_SHELL_FORM} max-w-3xl py-7'],
];

const files = [
  "src/app/(main)/profile/page.tsx",
  "src/app/(main)/profile/edit/page.tsx",
  "src/app/(main)/results/page.tsx",
  "src/app/(main)/results/[eventId]/page.tsx",
  "src/app/(main)/results/[eventId]/dispute/page.tsx",
  "src/app/(main)/certificates/[regId]/page.tsx",
  "src/app/(main)/photos/page.tsx",
  "src/app/(main)/terms/page.tsx",
  "src/app/(main)/privacy/page.tsx",
  "src/app/(main)/events/[id]/payment/page.tsx",
  "src/app/(main)/events/[id]/confirmation/page.tsx",
  "src/app/(main)/events/[id]/register/page.tsx",
];

const importLine =
  'import { PAGE_SHELL, PAGE_SHELL_FORM } from "@/lib/page-shell";\n';

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  for (const [re, to] of replacements) s = s.replace(re, to);
  if (s === before) {
    console.log("skip", f);
    continue;
  }
  if ((s.includes("${PAGE_SHELL") || s.includes("${PAGE_SHELL_FORM")) && !s.includes("@/lib/page-shell")) {
    if (s.startsWith('"use client"')) {
      s = s.replace('"use client";\n', '"use client";\n\n' + importLine);
    } else {
      s = importLine + s;
    }
  }
  fs.writeFileSync(f, s);
  console.log("ok", f);
}

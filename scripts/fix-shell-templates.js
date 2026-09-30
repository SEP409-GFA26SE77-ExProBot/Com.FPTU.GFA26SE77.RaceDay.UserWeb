const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const files = walk("src");
let fixed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  // Fix broken: className={`${PAGE_SHELL... py-7">  → close with backtick+
  s = s.replace(
    /className=\{`(\$\{PAGE_SHELL(?:_FORM)?\}[^`]*)">/g,
    "className={`$1`}"
  );
  s = s.replace(
    /className=\{`relative \$\{PAGE_SHELL_FORM\}([^`]*)">/g,
    "className={`relative ${PAGE_SHELL_FORM}$1`}"
  );
  if (s !== before) {
    // ensure import
    if (
      (s.includes("${PAGE_SHELL") || s.includes("${PAGE_SHELL_FORM")) &&
      !s.includes('@/lib/page-shell')
    ) {
      const importLine =
        'import { PAGE_SHELL, PAGE_SHELL_FORM } from "@/lib/page-shell";\n';
      if (s.startsWith('"use client"')) {
        s = s.replace('"use client";\n', '"use client";\n\n' + importLine);
      } else {
        s = importLine + s;
      }
    }
    fs.writeFileSync(f, s);
    console.log("fixed", f);
    fixed++;
  }
}
console.log("total", fixed);

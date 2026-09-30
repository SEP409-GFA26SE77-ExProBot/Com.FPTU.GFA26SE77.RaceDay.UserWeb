const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

let n = 0;
for (const f of walk("src")) {
  let s = fs.readFileSync(f, "utf8");
  const before = s;

  // 1) Fix outer PAGE_SHELL lines that end with "> instead of `}>
  s = s.replace(
    /(className=\{`(?:relative )?\$\{PAGE_SHELL(?:_FORM)?\}[^`\n]*)">/g,
    "$1`}>"
  );

  // 2) Fix normal className="..." that wrongly end with `}  (should be ">)
  s = s.replace(/(className="[^"`\n]*)`\}/g, '$1">');

  // 3) Fix Link/etc className="...`} cases same
  s = s.replace(/(className='[^'`\n]*)`\}/g, "$1'>");

  if (s === before) continue;

  if (
    (s.includes("${PAGE_SHELL}") || s.includes("${PAGE_SHELL_FORM}")) &&
    !s.includes("@/lib/page-shell")
  ) {
    const importLine =
      'import { PAGE_SHELL, PAGE_SHELL_FORM } from "@/lib/page-shell";\n';
    if (s.startsWith('"use client"')) {
      s = s.replace('"use client";\n', '"use client";\n\n' + importLine);
    } else if (!s.includes(importLine.trim())) {
      s = importLine + s;
    }
  }

  fs.writeFileSync(f, s);
  console.log("ok", f);
  n++;
}
console.log("fixed files", n);

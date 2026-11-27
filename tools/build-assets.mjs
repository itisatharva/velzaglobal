#!/usr/bin/env node
/**
 * Velza Global - minify shared CSS/JS and cache-bust their references.
 *
 *   node tools/build-assets.mjs
 *
 * Run it after editing any source file listed in ASSETS, then commit the
 * changed source, the regenerated .min file and the updated HTML.
 *
 * - Sources stay the files you edit (e.g. shared/css/theme.css).
 * - Pages load the generated .min file with a content-hash query
 *   (theme.min.css?v=1a2b3c4d), so browsers and Cloudflare (1-year cache)
 *   fetch the new version as soon as the content changes.
 * - JS is only whitespace/syntax-minified: names are never renamed, because
 *   these classic scripts share globals with each other and with inline code.
 *
 * Needs Node 18+ and network access for `npx esbuild` (pinned below).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ESBUILD = "esbuild@0.24.2";

const ASSETS = [
  "shared/css/theme.css",
  "shared/css/theme-colors.css",
  "shared/css/custom.css",
  "shared/css/responsive-fix.css",
  "shared/css/cookie-consent.css",
  "shared/css/darkstar-effects.css",
  "shared/js/theme.js",
  "shared/js/custom.js",
  "shared/js/responsive-fix.js",
  "shared/js/cookie-consent.js",
  "shared/js/darkstar-effects.js",
  "shared/js/counter-format.js",
];

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const hashes = {};

for (const src of ASSETS) {
  const out = src.replace(/\.(css|js)$/, ".min.$1");
  const isCss = src.endsWith(".css");
  const flags = isCss
    ? ["--minify"]
    : ["--minify-whitespace", "--minify-syntax", "--charset=utf8"];
  // Relative paths + cwd: the repo path may contain spaces, which the Windows shell would split.
  execFileSync(npx, ["--yes", ESBUILD, src, ...flags, `--outfile=${out}`, "--log-level=warning"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const min = readFileSync(join(ROOT, out));
  hashes[src] = createHash("sha256").update(min).digest("hex").slice(0, 8);
  const before = statSync(join(ROOT, src)).size;
  console.log(`${out}  ${before} -> ${min.length} bytes  v=${hashes[src]}`);
}

// Rewrite every page reference (source or .min, with or without ?v=) to the hashed .min URL.
function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith(".html")) yield p;
  }
}

let changed = 0;
for (const file of htmlFiles(join(ROOT, "regions"))) {
  const html = readFileSync(file, "utf8");
  let next = html;
  for (const src of ASSETS) {
    const base = "/" + src.replace(/\.(css|js)$/, "");
    const ext = src.endsWith(".css") ? "css" : "js";
    const re = new RegExp(`${base.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?:\\.min)?\\.${ext}(?:\\?v=[0-9A-Za-z]+)?(?=")`, "g");
    next = next.replace(re, `${base}.min.${ext}?v=${hashes[src]}`);
  }
  if (next !== html) {
    writeFileSync(file, next);
    changed++;
  }
}
console.log(`${changed} HTML files updated under regions/ (${relative(process.cwd(), ROOT) || "."})`);

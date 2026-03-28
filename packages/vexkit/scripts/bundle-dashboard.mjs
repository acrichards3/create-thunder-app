import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATIC_DIR = join(ROOT, "src/dashboard/static");
const OUT_DIR = join(ROOT, "dist/dashboard/bundle");

// Ensure output directory exists
mkdirSync(OUT_DIR, { recursive: true });

// --- Step 0: Clean and prepare working directory ---
const WORK_DIR = join(OUT_DIR, "_work");
try { rmSync(WORK_DIR, { recursive: true }); } catch {}
mkdirSync(WORK_DIR, { recursive: true });

// Copy strip-assistant-visible-text.js to work dir first
// so relative imports resolve during bundling
const stripSrc = join(STATIC_DIR, "strip-assistant-visible-text.js");
if (existsSync(stripSrc)) {
  copyFileSync(stripSrc, join(WORK_DIR, "strip-assistant-visible-text.js"));
}

// --- Step 1: Prepare working copies with CDN imports rewritten to npm packages ---
const chatPanelSrc = readFileSync(join(STATIC_DIR, "chat-panel.js"), "utf-8");
let chatPanelWork = chatPanelSrc
  .replace(
    `import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm"`,
    `import * as d3 from "d3"`
  )
  .replace(
    `import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.6/+esm"`,
    `import { marked } from "marked"`
  )
  .replace(
    `import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm"`,
    `import DOMPurify from "dompurify"`
  )
  // Remove version query params from relative imports
  .replace(/\?v=\d+/g, "");

const appSrc = readFileSync(join(STATIC_DIR, "app.js"), "utf-8");
let appWork = appSrc
  .replace(
    `import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm"`,
    `import * as d3 from "d3"`
  )
  .replace(
    `from "./chat-panel.js?v=20"`,
    `from "./chat-panel.js"`
  )
  .replace(/\?v=\d+/g, "");

writeFileSync(join(WORK_DIR, "chat-panel.js"), chatPanelWork, "utf-8");
writeFileSync(join(WORK_DIR, "app.js"), appWork, "utf-8");

// --- Step 2: Bundle chat-panel.js (inlines d3, marked, dompurify) ---
await esbuild.build({
  entryPoints: [join(WORK_DIR, "chat-panel.js")],
  bundle: true,
  format: "esm",
  outfile: join(OUT_DIR, "chat-panel.js"),
  splitting: false,
  sourcemap: false,
  minify: false,
  loader: {
    ".js": "js",
  },
  external: [],
  define: {},
});

// --- Step 3: Bundle app.js ---
await esbuild.build({
  entryPoints: [join(WORK_DIR, "app.js")],
  bundle: true,
  format: "esm",
  outfile: join(OUT_DIR, "app.js"),
  splitting: false,
  sourcemap: false,
  minify: false,
  loader: {
    ".js": "js",
  },
  external: [],
});

// --- Step 4: Process the HTML ---
const html = readFileSync(join(STATIC_DIR, "index.html"), "utf-8");

let processedHtml = html.replace(
  /<script src="\/app\.js\?v=\d+" type="module"><\/script>/,
  '<script src="/app.js" type="module"></script>'
);

writeFileSync(join(OUT_DIR, "index.html"), processedHtml, "utf-8");

// --- Step 5: Copy non-JS static assets ---
const docsSrc = join(STATIC_DIR, "docs.html");
if (existsSync(docsSrc)) {
  copyFileSync(docsSrc, join(OUT_DIR, "docs.html"));
}

// Clean up work dir
try { rmSync(WORK_DIR, { recursive: true }); } catch {}

console.log("Bundle created at:", OUT_DIR);

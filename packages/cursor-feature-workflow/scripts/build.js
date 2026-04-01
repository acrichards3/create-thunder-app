import * as esbuild from "esbuild";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "src");
const OUT_DIR = join(ROOT, "dist");

mkdirSync(OUT_DIR, { recursive: true });

await esbuild.build({
  entryPoints: [join(SRC_DIR, "extension.ts")],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node18",
  outfile: join(OUT_DIR, "extension.cjs"),
  external: ["vscode"],
  sourcemap: false,
  minify: false,
  loader: {
    ".ts": "ts",
  },
});

console.log("Extension built to:", OUT_DIR);

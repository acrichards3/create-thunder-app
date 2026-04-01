import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BUNDLE_SRC = join(ROOT, "../vexkit/dist/dashboard/bundle");
const MEDIA_DEST = join(ROOT, "media");

// Ensure media directory exists
mkdirSync(MEDIA_DEST, { recursive: true });

// Copy all files from bundle to media
if (existsSync(BUNDLE_SRC)) {
  for (const file of readdirSync(BUNDLE_SRC)) {
    copyFileSync(join(BUNDLE_SRC, file), join(MEDIA_DEST, file));
  }
  console.log("Copied dashboard bundle to media/");
} else {
  console.warn("Bundle not found. Run `bun run bundle` first.");
}

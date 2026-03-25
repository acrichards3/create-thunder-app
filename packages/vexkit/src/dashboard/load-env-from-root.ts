import { join } from "bun:path";
import { tryCatchAsync } from "@vex-app/lib";

function applyEnvLine(trimmed: string): void {
  if (trimmed === "" || trimmed.startsWith("#")) {
    return;
  }
  const eq = trimmed.indexOf("=");
  if (eq === -1) {
    return;
  }
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (key.length === 0) {
    return;
  }
  const cur = process.env[key];
  if (typeof cur === "string" && cur.length > 0) {
    return;
  }
  process.env[key] = value;
}

export async function loadEnvFileFromRoot(rootAbs: string): Promise<void> {
  const path = join(rootAbs, ".env");
  const file = Bun.file(path);
  const [exists, existsErr] = await tryCatchAsync(async () => file.exists());
  if (existsErr != null || exists !== true) {
    return;
  }
  const [text, textErr] = await tryCatchAsync(async () => file.text());
  if (textErr != null) {
    return;
  }
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    applyEnvLine(lines[i].trim());
  }
}

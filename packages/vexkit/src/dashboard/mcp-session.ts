import { tryCatch } from "@vex-app/lib";

function parseMcpCommandFlat(): string[] {
  const raw = Bun.env.VEXKIT_MCP_COMMAND_JSON;
  if (raw == null) {
    return [];
  }
  if (raw.trim() === "") {
    return [];
  }
  const [parsed, err] = tryCatch((): unknown => JSON.parse(raw));
  if (err != null) {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  if (parsed.length === 0) {
    return [];
  }
  const cmd0 = parsed[0];
  if (typeof cmd0 !== "string" || cmd0.length === 0) {
    return [];
  }
  const rest = parsed.slice(1);
  for (const p of rest) {
    if (typeof p !== "string") {
      return [];
    }
  }
  return [cmd0, ...rest];
}

export function isMcpConfiguredInEnv(): boolean {
  return parseMcpCommandFlat().length > 0;
}

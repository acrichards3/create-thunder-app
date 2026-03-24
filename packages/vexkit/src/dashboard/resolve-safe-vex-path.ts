import { realpath } from "bun:fs/promises";
import { join } from "bun:path";

export type ResolveSafeVexPathResult = { absolutePath: string; kind: "ok" } | { kind: "error"; message: string };

function splitPathSegments(raw: string): string[] {
  return raw.split("/").filter((s) => s.length > 0 && s !== ".");
}

export async function resolveSafeVexPath(input: {
  rawRelativePath: string;
  rootAbs: string;
}): Promise<ResolveSafeVexPathResult> {
  const { rawRelativePath, rootAbs } = input;
  const decoded = decodeURIComponent(rawRelativePath);
  const segments = splitPathSegments(decoded);

  if (segments.some((s) => s === "..")) {
    return { kind: "error", message: "Path must not contain parent segments." };
  }

  const targetPath = join(rootAbs, ...segments);
  const rootReal = await realpath(rootAbs);
  let targetReal: string;

  try {
    targetReal = await realpath(targetPath);
  } catch {
    return { kind: "error", message: "File not found." };
  }

  const rootWithSep = rootReal.endsWith("/") ? rootReal : `${rootReal}/`;
  const isRoot = targetReal === rootReal;
  const underRoot = targetReal.startsWith(rootWithSep);
  if (!isRoot && !underRoot) {
    return { kind: "error", message: "Path escapes project root." };
  }

  if (!targetReal.endsWith(".vex")) {
    return { kind: "error", message: "Not a .vex file." };
  }

  return { absolutePath: targetReal, kind: "ok" };
}

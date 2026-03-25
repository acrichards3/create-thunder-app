import { join } from "bun:path";
import { realpath } from "bun:fs/promises";

const BLOCKED_SEGMENTS = new Set([".git", "node_modules"]);

export function splitPathSegments(raw: string): string[] {
  return raw.split("/").filter((s) => s.length > 0 && s !== ".");
}

export function segmentsInvalid(segments: string[]): boolean {
  if (segments.some((s) => s === "..")) {
    return true;
  }
  if (segments.some((s) => BLOCKED_SEGMENTS.has(s))) {
    return true;
  }
  return false;
}

export async function rootRealAndPrefix(rootAbs: string): Promise<{ rootReal: string; rootWithSeparator: string }> {
  const rootReal = await realpath(rootAbs);
  const rootWithSeparator = rootReal.endsWith("/") ? rootReal : `${rootReal}/`;
  return { rootReal, rootWithSeparator };
}

export async function isPathUnderRoot(input: {
  absPath: string;
  rootReal: string;
  rootWithSeparator: string;
}): Promise<boolean> {
  const { absPath, rootReal, rootWithSeparator } = input;
  let resolved: string;
  try {
    resolved = await realpath(absPath);
  } catch {
    return false;
  }
  if (resolved === rootReal) {
    return true;
  }
  return resolved.startsWith(rootWithSeparator);
}

export function joinUnderRoot(rootAbs: string, segments: string[]): string {
  return join(rootAbs, ...segments);
}

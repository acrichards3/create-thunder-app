import { mkdir } from "node:fs/promises";
import { realpath } from "bun:fs/promises";
import { dirname, join } from "bun:path";
import { tryCatchAsync } from "@vex-app/lib";

type ResolveSafeVexPathResult = { absolutePath: string; kind: "ok" } | { kind: "error"; message: string };

function splitPathSegments(raw: string): string[] {
  return raw.split("/").filter((s) => s.length > 0 && s !== ".");
}

function segmentBlockedForWrite(seg: string | undefined): boolean {
  if (seg === ".git") {
    return true;
  }
  if (seg === "node_modules") {
    return true;
  }
  if (seg === ".vexkit") {
    return true;
  }
  return false;
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

export async function resolveSafeVexWritePath(input: {
  rawRelativePath: string;
  rootAbs: string;
}): Promise<ResolveSafeVexPathResult> {
  const decoded = decodeURIComponent(input.rawRelativePath);
  const segments = splitPathSegments(decoded);
  if (segments.some((s) => s === "..")) {
    return { kind: "error", message: "Path must not contain parent segments." };
  }
  if (segments.length === 0) {
    return { kind: "error", message: "Invalid path." };
  }
  if (segmentBlockedForWrite(segments[0])) {
    return { kind: "error", message: "Path is not allowed." };
  }
  const last = segments.at(-1) ?? "";
  if (!last.endsWith(".vex")) {
    return { kind: "error", message: "Not a .vex file." };
  }
  const targetPath = join(input.rootAbs, ...segments);
  const rootReal = await realpath(input.rootAbs);
  const rootWithSep = rootReal.endsWith("/") ? rootReal : `${rootReal}/`;
  const parentDir = dirname(targetPath);
  const [, mkdirErr] = await tryCatchAsync(async () => mkdir(parentDir, { recursive: true }));
  if (mkdirErr != null) {
    return { kind: "error", message: "Could not create parent directory." };
  }
  let parentReal: string;
  try {
    parentReal = await realpath(parentDir);
  } catch {
    return { kind: "error", message: "Invalid parent path." };
  }
  const isRoot = parentReal === rootReal;
  const underRoot = parentReal.startsWith(rootWithSep);
  if (!isRoot && !underRoot) {
    return { kind: "error", message: "Path escapes project root." };
  }
  return { absolutePath: targetPath, kind: "ok" };
}

export async function resolveSafeSpecWritePath(input: {
  rawRelativePath: string;
  rootAbs: string;
}): Promise<ResolveSafeVexPathResult> {
  const decoded = decodeURIComponent(input.rawRelativePath);
  const segments = splitPathSegments(decoded);
  if (segments.some((s) => s === "..")) {
    return { kind: "error", message: "Path must not contain parent segments." };
  }
  if (segments.length === 0) {
    return { kind: "error", message: "Invalid path." };
  }
  if (segmentBlockedForWrite(segments[0])) {
    return { kind: "error", message: "Path is not allowed." };
  }
  const last = segments.at(-1) ?? "";
  if (!last.endsWith(".spec.ts")) {
    return { kind: "error", message: "Not a .spec.ts file." };
  }
  const targetPath = join(input.rootAbs, ...segments);
  const rootReal = await realpath(input.rootAbs);
  const rootWithSep = rootReal.endsWith("/") ? rootReal : `${rootReal}/`;
  const parentDir = dirname(targetPath);
  const [, mkdirErr] = await tryCatchAsync(async () => mkdir(parentDir, { recursive: true }));
  if (mkdirErr != null) {
    return { kind: "error", message: "Could not create parent directory." };
  }
  let parentReal: string;
  try {
    parentReal = await realpath(parentDir);
  } catch {
    return { kind: "error", message: "Invalid parent path." };
  }
  const isRoot = parentReal === rootReal;
  const underRoot = parentReal.startsWith(rootWithSep);
  if (!isRoot && !underRoot) {
    return { kind: "error", message: "Path escapes project root." };
  }
  return { absolutePath: targetPath, kind: "ok" };
}

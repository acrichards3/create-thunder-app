import { tryCatch } from "@vex-app/lib";
import { isRecord } from "./dashboard-helpers.js";

function readPathFromRecord(parsed: Record<string, unknown>): string {
  const pathVal = parsed.path;
  if (typeof pathVal === "string" && pathVal.length > 0) {
    return pathVal;
  }
  const filePath = parsed.file_path;
  if (typeof filePath === "string" && filePath.length > 0) {
    return filePath;
  }
  return "";
}

function extractPathFromToolArgs(argsStr: string): string {
  const [parsed, err] = tryCatch((): unknown => JSON.parse(argsStr));
  if (err != null || !isRecord(parsed)) {
    return "";
  }
  return readPathFromRecord(parsed);
}

function findPathDeep(value: unknown, depth: number): string {
  if (depth > 8) {
    return "";
  }
  if (typeof value === "string" && value.length > 1 && value.length < 2048 && !value.includes("\n")) {
    const looksLikePath = [value.includes("/"), value.endsWith(".ts"), value.endsWith(".vex")].some(Boolean);
    if (looksLikePath) {
      return value;
    }
  }
  if (!isRecord(value)) {
    return "";
  }
  const direct = readPathFromRecord(value);
  if (direct.length > 0) {
    return direct;
  }
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    const found = findPathDeep(value[keys[i]], depth + 1);
    if (found.length > 0) {
      return found;
    }
  }
  return "";
}

function extractFilePath(params: unknown): string {
  if (!isRecord(params)) {
    return "";
  }
  const toolCall = params.toolCall;
  if (isRecord(toolCall) && typeof toolCall.arguments === "string") {
    const fromArgs = extractPathFromToolArgs(toolCall.arguments);
    if (fromArgs.length > 0) {
      return fromArgs;
    }
  }
  return findPathDeep(params, 0);
}

const WRITE_FRAGMENTS = [
  "write",
  "create",
  "edit",
  "delete",
  "remove",
  "replace",
  "insert",
  "append",
  "save",
  "patch",
  "put",
  "mkdir",
  "rename",
  "move",
] as const;

const READ_FRAGMENTS = [
  "read",
  "get",
  "list",
  "search",
  "find",
  "grep",
  "view",
  "show",
  "cat",
  "head",
  "tail",
  "stat",
  "ls",
  "dir",
] as const;

function classifyToolIntent(params: unknown): "read" | "unknown" | "write" {
  if (!isRecord(params)) {
    return "unknown";
  }
  const serialized = JSON.stringify(params).toLowerCase();
  const hasWrite = WRITE_FRAGMENTS.some((f) => serialized.includes(f));
  if (hasWrite) {
    return "write";
  }
  const hasRead = READ_FRAGMENTS.some((f) => serialized.includes(f));
  if (hasRead) {
    return "read";
  }
  return "unknown";
}

function isTerminalPermission(params: unknown): boolean {
  if (!isRecord(params)) {
    return false;
  }
  const s = JSON.stringify(params).toLowerCase();
  return ["terminal", "shell", "run_", "execute_command", "run_command"].some((frag) => s.includes(frag));
}

function isVexPath(filePath: string): boolean {
  const last = filePath.split("/").pop() ?? "";
  return last.endsWith(".vex");
}

function checkDescribeAccess(params: unknown): boolean {
  if (isTerminalPermission(params)) {
    return false;
  }
  const intent = classifyToolIntent(params);
  if (intent === "write") {
    return false;
  }
  if (intent === "read") {
    return true;
  }
  return false;
}

function checkSpecAccess(params: unknown): boolean {
  if (isTerminalPermission(params)) {
    return false;
  }
  const intent = classifyToolIntent(params);
  if (intent === "read") {
    return true;
  }
  const path = extractFilePath(params);
  if (path.length === 0) {
    return false;
  }
  return isVexPath(path);
}

function checkBuildAccess(params: unknown): boolean {
  const path = extractFilePath(params);
  if (path.length === 0) {
    return true;
  }
  return !isVexPath(path);
}

export function shouldAllowPermission(step: number, params: unknown): boolean {
  if (step === 0) {
    return checkDescribeAccess(params);
  }
  if (step === 1 || step === 2) {
    return checkSpecAccess(params);
  }
  if (step === 3) {
    return checkBuildAccess(params);
  }
  return false;
}

export function buildPermissionResult(allow: boolean): Record<string, unknown> {
  const optionId = allow ? "allow-once" : "reject-once";
  return { outcome: { optionId, outcome: "selected" } };
}

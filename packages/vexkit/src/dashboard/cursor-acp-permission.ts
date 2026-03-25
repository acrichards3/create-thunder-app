import { tryCatch } from "@vex-app/lib";
import { getRepoWriteDenialReason } from "./repo-write-policy.js";
import type { WorkflowPhase } from "./workflow-store.js";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function readPathFromParsedRecord(parsed: Record<string, unknown>): string {
  let result = "";
  const pathVal = parsed.path;
  if (typeof pathVal === "string" && pathVal.length > 0) {
    result = pathVal;
  }
  if (result.length === 0) {
    const filePath = parsed.file_path;
    if (typeof filePath === "string" && filePath.length > 0) {
      result = filePath;
    }
  }
  return result;
}

function extractPathFromToolArgumentsJson(argsStr: string): string {
  let result = "";
  const [parsed, err] = tryCatch((): unknown => JSON.parse(argsStr));
  if (err == null && isRecord(parsed)) {
    result = readPathFromParsedRecord(parsed);
  }
  return result;
}

function stringLooksLikeRepoPath(value: string): boolean {
  if (value.length <= 1 || value.length >= 2048) {
    return false;
  }
  if (value.includes("\n")) {
    return false;
  }
  if (value.includes("/")) {
    return true;
  }
  if (value.endsWith(".ts")) {
    return true;
  }
  return value.endsWith(".vex");
}

function findPathInRecordChildren(value: Record<string, unknown>, depth: number): string {
  const keys = Object.keys(value);
  let result = "";
  for (let i = 0; i < keys.length; i += 1) {
    const found = extractPathFromParamsDeep(value[keys[i]], depth + 1);
    if (found.length > 0) {
      result = found;
      break;
    }
  }
  return result;
}

function extractPathFromParamsDeep(value: unknown, depth: number): string {
  let result = "";
  if (depth <= 8) {
    if (typeof value === "string" && stringLooksLikeRepoPath(value)) {
      result = value;
    } else if (isRecord(value)) {
      const direct = readPathFromParsedRecord(value);
      if (direct.length > 0) {
        result = direct;
      } else {
        result = findPathInRecordChildren(value, depth);
      }
    }
  }
  return result;
}

function toolNameFromParams(params: unknown): string {
  let result = "";
  if (isRecord(params)) {
    const tc = params.toolCall;
    if (isRecord(tc) && typeof tc.name === "string") {
      result = tc.name;
    } else if (typeof params.name === "string") {
      result = params.name;
    }
  }
  return result;
}

function isLikelyTerminalPermission(params: unknown): boolean {
  const name = toolNameFromParams(params);
  const lower = name.toLowerCase();
  const hitName = ["terminal", "shell", "run_"].some((frag) => lower.includes(frag));
  if (hitName) {
    return true;
  }
  const s = JSON.stringify(params).toLowerCase();
  const hitJson = ["run_terminal", "execute_command"].some((frag) => s.includes(frag));
  return hitJson;
}

function pathLooksFileLike(pathDeep: string): boolean {
  if (pathDeep.includes(".")) {
    return true;
  }
  return pathDeep.includes("/");
}

export function shouldAllowCursorPermission(input: { params: unknown; phase: WorkflowPhase }): boolean {
  const { params, phase } = input;
  if (phase === "spec" && isLikelyTerminalPermission(params)) {
    return false;
  }
  if (!isRecord(params)) {
    return true;
  }
  const toolCall = params.toolCall;
  if (isRecord(toolCall) && typeof toolCall.arguments === "string") {
    const pathVal = extractPathFromToolArgumentsJson(toolCall.arguments);
    if (pathVal.length > 0) {
      const deny = getRepoWriteDenialReason(phase, pathVal);
      return deny.length === 0;
    }
  }
  const pathDeep = extractPathFromParamsDeep(params, 0);
  if (pathDeep.length > 0 && pathLooksFileLike(pathDeep)) {
    const deny = getRepoWriteDenialReason(phase, pathDeep);
    return deny.length === 0;
  }
  return true;
}

export function buildPermissionRpcResult(allow: boolean): Record<string, unknown> {
  const optionId = allow ? "allow-once" : "reject-once";
  return { outcome: { optionId, outcome: "selected" } };
}

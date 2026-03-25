import { mkdir } from "node:fs/promises";
import { join } from "bun:path";
import { tryCatch, tryCatchAsync } from "@vex-app/lib";
import { parseAndValidateVexDocument } from "../vex/parse-and-validate-vex-document";
import { resolveSafeVexPath } from "./resolve-safe-vex-path";
import { isWorkflowPhaseValue } from "./workflow-phase-guard.js";

export type WorkflowPhase = "build" | "done" | "spec" | "verify";

export type VerifyLastResult = { log: string; ok: boolean };

export type WorkflowState = {
  approvalsByPath: Record<string, string[]>;
  currentVexPath: string;
  phase: WorkflowPhase;
  verifyLastResult?: VerifyLastResult;
};

const WORKFLOW_DIR = ".vexkit";
const WORKFLOW_FILE = "workflow.json";

export function workflowFileAbs(rootAbs: string): string {
  return join(rootAbs, WORKFLOW_DIR, WORKFLOW_FILE);
}

function defaultWorkflow(): WorkflowState {
  return {
    approvalsByPath: {},
    currentVexPath: "",
    phase: "spec",
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  if (typeof v !== "object") {
    return false;
  }
  if (v === null) {
    return false;
  }
  return true;
}

function normalizeApprovals(raw: unknown): Record<string, string[]> {
  if (!isRecord(raw)) {
    return {};
  }
  const out: Record<string, string[]> = {};
  for (const key of Object.keys(raw)) {
    const val = raw[key];
    if (!Array.isArray(val)) {
      continue;
    }
    const names = val.filter((x): x is string => typeof x === "string" && x.length > 0);
    if (names.length > 0) {
      out[key] = [...new Set(names)].toSorted((a, b) => a.localeCompare(b));
    }
  }
  return out;
}

export function parseWorkflowJson(text: string): WorkflowState {
  const [parsed, err] = tryCatch((): unknown => JSON.parse(text));
  if (err != null) {
    return defaultWorkflow();
  }
  if (!isRecord(parsed)) {
    return defaultWorkflow();
  }
  const phaseRaw = parsed.phase;
  const phase: WorkflowPhase = isWorkflowPhaseValue(phaseRaw) ? phaseRaw : "spec";
  const currentVexPath = typeof parsed.currentVexPath === "string" ? parsed.currentVexPath : "";
  const verifyRaw = parsed.verifyLastResult;
  let verifyLastResult: VerifyLastResult | undefined = undefined;
  if (isRecord(verifyRaw)) {
    const ok = verifyRaw.ok;
    const log = verifyRaw.log;
    if (typeof ok === "boolean" && typeof log === "string") {
      verifyLastResult = { log, ok };
    }
  }
  return {
    approvalsByPath: normalizeApprovals(parsed.approvalsByPath),
    currentVexPath,
    phase,
    ...(verifyLastResult != null ? { verifyLastResult } : {}),
  };
}

export async function readWorkflowState(rootAbs: string): Promise<WorkflowState> {
  const path = workflowFileAbs(rootAbs);
  const file = Bun.file(path);
  const exists = await file.exists();
  if (!exists) {
    return defaultWorkflow();
  }
  const [text, readErr] = await tryCatchAsync(async () => file.text());
  if (readErr != null) {
    return defaultWorkflow();
  }
  return parseWorkflowJson(text);
}

export async function writeWorkflowState(rootAbs: string, state: WorkflowState): Promise<void> {
  const dir = join(rootAbs, WORKFLOW_DIR);
  const path = workflowFileAbs(rootAbs);
  const [, mkdirErr] = await tryCatchAsync(async () => mkdir(dir, { recursive: true }));
  if (mkdirErr != null) {
    return;
  }
  const payload: Record<string, unknown> = {
    approvalsByPath: state.approvalsByPath,
    currentVexPath: state.currentVexPath,
    phase: state.phase,
  };
  if (state.verifyLastResult != null) {
    payload.verifyLastResult = state.verifyLastResult;
  }
  await Bun.write(path, `${JSON.stringify(payload, null, 2)}\n`);
}

export async function listFunctionNamesForVexPath(input: {
  rootAbs: string;
  vexRelativePath: string;
}): Promise<{ functionNames: string[]; kind: "ok" } | { kind: "error"; message: string }> {
  const resolved = await resolveSafeVexPath({ rawRelativePath: input.vexRelativePath, rootAbs: input.rootAbs });
  if (resolved.kind !== "ok") {
    return { kind: "error", message: resolved.message };
  }
  const source = await Bun.file(resolved.absolutePath).text();
  const result = parseAndValidateVexDocument(source);
  if (!result.ok || result.document == null) {
    return { kind: "error", message: "Invalid or empty .vex document." };
  }
  const functionNames = result.document.functions.map((f) => f.name);
  return { functionNames, kind: "ok" };
}

function approvalsForPath(state: WorkflowState, vexPath: string): Set<string> {
  if (!Object.hasOwn(state.approvalsByPath, vexPath)) {
    return new Set();
  }
  const list = state.approvalsByPath[vexPath];
  return new Set(list);
}

export function allFunctionsApproved(input: {
  functionNames: readonly string[];
  state: WorkflowState;
  vexPath: string;
}): boolean {
  if (input.functionNames.length === 0) {
    return false;
  }
  const approved = approvalsForPath(input.state, input.vexPath);
  return input.functionNames.every((n) => approved.has(n));
}

export async function canTransitionToBuild(input: {
  rootAbs: string;
  state: WorkflowState;
}): Promise<{ ok: true } | { message: string; ok: false }> {
  const { currentVexPath, phase } = input.state;
  if (phase !== "spec") {
    return { message: "Already past spec phase.", ok: false };
  }
  if (currentVexPath.length === 0) {
    return { message: "Select a .vex file before moving to build.", ok: false };
  }
  const namesResult = await listFunctionNamesForVexPath({
    rootAbs: input.rootAbs,
    vexRelativePath: currentVexPath,
  });
  if (namesResult.kind === "error") {
    return { message: namesResult.message, ok: false };
  }
  if (
    !allFunctionsApproved({ functionNames: namesResult.functionNames, state: input.state, vexPath: currentVexPath })
  ) {
    return { message: "Approve every function tree in the current .vex file before build.", ok: false };
  }
  return { ok: true };
}

export function canTransitionToDone(state: WorkflowState): { message: string; ok: boolean } {
  if (state.phase !== "verify") {
    return { message: "Done is only available after verify.", ok: false };
  }
  if (state.verifyLastResult?.ok !== true) {
    return { message: "Verification must pass before marking done.", ok: false };
  }
  return { message: "", ok: true };
}

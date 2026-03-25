import { tryCatchAsync } from "@vex-app/lib";
import { resolveSafeVexPath } from "./resolve-safe-vex-path";
import {
  listFunctionNamesForVexPath,
  readWorkflowState,
  type WorkflowState,
  writeWorkflowState,
} from "./workflow-store.js";
import { validateWorkflowPhaseChange } from "./workflow-phase-transition.js";
import { isWorkflowPhaseValue } from "./workflow-phase-guard.js";

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    status,
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v != null;
}

export async function getWorkflowHttp(rootAbs: string): Promise<Response> {
  const state = await readWorkflowState(rootAbs);
  return jsonResponse(state, 200);
}

type FieldError = { message: string; state: WorkflowState; status: 400 };

type FieldResult = { error: FieldError | null };

async function applyCurrentVexPathField(input: {
  body: Record<string, unknown>;
  next: WorkflowState;
  rootAbs: string;
  state: WorkflowState;
}): Promise<FieldResult> {
  const pathRaw = input.body.currentVexPath;
  if (typeof pathRaw !== "string") {
    return { error: null };
  }
  if (pathRaw.length === 0) {
    input.next.currentVexPath = "";
    return { error: null };
  }
  const resolved = await resolveSafeVexPath({ rawRelativePath: pathRaw, rootAbs: input.rootAbs });
  if (resolved.kind !== "ok") {
    return { error: { message: resolved.message, state: input.state, status: 400 } };
  }
  input.next.currentVexPath = pathRaw;
  return { error: null };
}

function applyApproveFunctionField(input: {
  body: Record<string, unknown>;
  next: WorkflowState;
  state: WorkflowState;
}): FieldResult {
  const approveFn = input.body.approveFunction;
  if (typeof approveFn !== "string") {
    return { error: null };
  }
  if (approveFn.length === 0) {
    return { error: null };
  }
  const key = input.next.currentVexPath;
  if (key.length === 0) {
    return { error: { message: "Set currentVexPath before approving functions.", state: input.state, status: 400 } };
  }
  const existing = input.next.approvalsByPath[key] ?? [];
  const merged = [...new Set([...existing, approveFn])].toSorted((a, b) => a.localeCompare(b));
  input.next.approvalsByPath = { ...input.next.approvalsByPath, [key]: merged };
  return { error: null };
}

async function applyApproveAllFunctionsField(input: {
  body: Record<string, unknown>;
  next: WorkflowState;
  rootAbs: string;
  state: WorkflowState;
}): Promise<FieldResult> {
  if (input.body.approveAllFunctionsForCurrentPath !== true) {
    return { error: null };
  }
  const key = input.next.currentVexPath;
  if (key.length === 0) {
    return { error: { message: "Set currentVexPath before approving functions.", state: input.state, status: 400 } };
  }
  const namesResult = await listFunctionNamesForVexPath({
    rootAbs: input.rootAbs,
    vexRelativePath: key,
  });
  if (namesResult.kind === "error") {
    return { error: { message: namesResult.message, state: input.state, status: 400 } };
  }
  input.next.approvalsByPath = {
    ...input.next.approvalsByPath,
    [key]: [...namesResult.functionNames].toSorted((a, b) => a.localeCompare(b)),
  };
  return { error: null };
}

function applyUnapproveFunctionField(input: {
  body: Record<string, unknown>;
  next: WorkflowState;
  state: WorkflowState;
}): FieldResult {
  const unapproveFn = input.body.unapproveFunction;
  if (typeof unapproveFn !== "string") {
    return { error: null };
  }
  if (unapproveFn.length === 0) {
    return { error: null };
  }
  const key = input.next.currentVexPath;
  if (key.length === 0) {
    return { error: { message: "Set currentVexPath before changing approvals.", state: input.state, status: 400 } };
  }
  const existing = input.next.approvalsByPath[key] ?? [];
  const filtered = existing.filter((n) => n !== unapproveFn);
  const copy = { ...input.next.approvalsByPath };
  if (filtered.length === 0) {
    delete copy[key];
  } else {
    copy[key] = filtered;
  }
  input.next.approvalsByPath = copy;
  return { error: null };
}

function applyClearApprovalsField(input: { body: Record<string, unknown>; next: WorkflowState }): void {
  const clearPath = input.body.clearApprovalsForPath;
  if (typeof clearPath !== "string") {
    return;
  }
  if (clearPath.length === 0) {
    return;
  }
  const copy = { ...input.next.approvalsByPath };
  delete copy[clearPath];
  input.next.approvalsByPath = copy;
}

async function applyPhaseField(input: {
  body: Record<string, unknown>;
  next: WorkflowState;
  rootAbs: string;
  state: WorkflowState;
}): Promise<FieldResult> {
  if (!Object.hasOwn(input.body, "phase")) {
    return { error: null };
  }
  const phaseRaw = input.body.phase;
  if (!isWorkflowPhaseValue(phaseRaw)) {
    return { error: { message: "Invalid phase.", state: input.state, status: 400 } };
  }
  const prev = input.state.phase;
  const transitionErr = await validateWorkflowPhaseChange({
    nextPhase: phaseRaw,
    nextState: input.next,
    prevPhase: prev,
    rootAbs: input.rootAbs,
    state: input.state,
  });
  if (transitionErr != null) {
    return { error: { message: transitionErr.message, state: input.state, status: transitionErr.status } };
  }

  input.next.phase = phaseRaw;
  const backFromVerify = phaseRaw === "build" ? true : phaseRaw === "spec";
  if (prev === "verify" && backFromVerify) {
    delete input.next.verifyLastResult;
  }
  return { error: null };
}

async function applyPostBody(input: {
  body: Record<string, unknown>;
  rootAbs: string;
  state: WorkflowState;
}): Promise<{ message?: string; state: WorkflowState; status: number }> {
  if (input.body.resetWorkflow === true) {
    return {
      state: {
        approvalsByPath: {},
        currentVexPath: "",
        phase: "spec",
      },
      status: 200,
    };
  }

  const next: WorkflowState = {
    approvalsByPath: { ...input.state.approvalsByPath },
    currentVexPath: input.state.currentVexPath,
    phase: input.state.phase,
    ...(input.state.verifyLastResult != null ? { verifyLastResult: input.state.verifyLastResult } : {}),
  };

  const pathRes = await applyCurrentVexPathField({
    body: input.body,
    next,
    rootAbs: input.rootAbs,
    state: input.state,
  });
  if (pathRes.error != null) {
    const err = pathRes.error;
    return { message: err.message, state: err.state, status: err.status };
  }

  const apRes = applyApproveFunctionField({ body: input.body, next, state: input.state });
  if (apRes.error != null) {
    const err = apRes.error;
    return { message: err.message, state: err.state, status: err.status };
  }

  const apAllRes = await applyApproveAllFunctionsField({
    body: input.body,
    next,
    rootAbs: input.rootAbs,
    state: input.state,
  });
  if (apAllRes.error != null) {
    const err = apAllRes.error;
    return { message: err.message, state: err.state, status: err.status };
  }

  const unRes = applyUnapproveFunctionField({ body: input.body, next, state: input.state });
  if (unRes.error != null) {
    const err = unRes.error;
    return { message: err.message, state: err.state, status: err.status };
  }

  applyClearApprovalsField({ body: input.body, next });

  const phRes = await applyPhaseField({ body: input.body, next, rootAbs: input.rootAbs, state: input.state });
  if (phRes.error != null) {
    const err = phRes.error;
    return { message: err.message, state: err.state, status: err.status };
  }

  return { state: next, status: 200 };
}

export async function postWorkflowHttp(req: Request, rootAbs: string): Promise<Response> {
  const [rawBody, bodyErr] = await tryCatchAsync(async () => req.json());
  if (bodyErr != null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  if (rawBody == null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  if (!isRecord(rawBody)) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }

  const state = await readWorkflowState(rootAbs);
  const applied = await applyPostBody({ body: rawBody, rootAbs, state });
  if (applied.status !== 200) {
    return jsonResponse({ message: applied.message ?? "Bad request." }, applied.status);
  }
  await writeWorkflowState(rootAbs, applied.state);
  return jsonResponse(applied.state, 200);
}

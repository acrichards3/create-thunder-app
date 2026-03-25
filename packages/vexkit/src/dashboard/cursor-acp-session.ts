import { spawn } from "node:child_process";
import { tryCatch, tryCatchAsync } from "@vex-app/lib";
import { buildPermissionRpcResult, shouldAllowCursorPermission } from "./cursor-acp-permission.js";
import type { WorkflowPhase } from "./workflow-store.js";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractDeltaFromUpdateParams(params: unknown): string {
  if (!isRecord(params)) {
    return "";
  }
  const update = params.update;
  if (!isRecord(update)) {
    return "";
  }
  const content = update.content;
  if (isRecord(content) && typeof content.text === "string") {
    return content.text;
  }
  const sessionUpdate = update.sessionUpdate;
  if (sessionUpdate === "agent_message_chunk" && isRecord(content) && typeof content.text === "string") {
    return content.text;
  }
  return "";
}

function getCursorAgentBin(): string {
  const raw = Bun.env.VEXKIT_CURSOR_AGENT_BIN;
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  return "agent";
}

export function isCursorAgentConfigured(): boolean {
  const key = Bun.env.CURSOR_API_KEY;
  return typeof key === "string" && key.length > 0;
}

export function shouldUseCursorAgent(): boolean {
  return Bun.env.VEXKIT_USE_CURSOR_AGENT === "1" && isCursorAgentConfigured();
}

type PendingMap = Map<number, { reject: (e: Error) => void; resolve: (v: unknown) => void }>;

function resolveJsonRpcResponse(parsed: Record<string, unknown>, pending: PendingMap): void {
  const rpcId = parsed.id;
  if (typeof rpcId !== "number") {
    return;
  }
  const hasResult = Object.hasOwn(parsed, "result");
  const hasError = Object.hasOwn(parsed, "error");
  if (!hasResult && !hasError) {
    return;
  }
  const waiter = pending.get(rpcId);
  if (waiter == null) {
    return;
  }
  pending.delete(rpcId);
  const errorVal = parsed.error;
  if (errorVal != null) {
    waiter.reject(new Error(JSON.stringify(errorVal)));
    return;
  }
  waiter.resolve(parsed.result);
}

type StreamCtx = {
  accumulated: string;
  onDelta?: (text: string) => void;
  phase: WorkflowPhase;
  sendLine: (obj: Record<string, unknown>) => void;
  streamedCharCount: number;
};

function handleSessionUpdate(parsed: Record<string, unknown>, ctx: StreamCtx): void {
  const delta = extractDeltaFromUpdateParams(parsed.params);
  if (delta.length === 0) {
    return;
  }
  ctx.accumulated += delta;
  ctx.streamedCharCount += delta.length;
  ctx.onDelta?.(delta);
}

function handlePermissionRequest(parsed: Record<string, unknown>, ctx: StreamCtx): void {
  const rpcId = parsed.id;
  if (typeof rpcId !== "number") {
    return;
  }
  const allow = shouldAllowCursorPermission({
    params: parsed.params,
    phase: ctx.phase,
  });
  ctx.sendLine({
    id: rpcId,
    jsonrpc: "2.0",
    result: buildPermissionRpcResult(allow),
  });
}

function processAcpLine(trimmed: string, pending: PendingMap, ctx: StreamCtx): void {
  const [parsed, err] = tryCatch((): unknown => JSON.parse(trimmed));
  if (err != null || !isRecord(parsed)) {
    return;
  }
  resolveJsonRpcResponse(parsed, pending);
  const method = parsed.method;
  if (method === "session/update") {
    handleSessionUpdate(parsed, ctx);
    return;
  }
  if (method === "session/request_permission") {
    handlePermissionRequest(parsed, ctx);
  }
}

export async function runCursorAcpPrompt(input: {
  onDelta?: (text: string) => void;
  phase: WorkflowPhase;
  promptText: string;
  rootAbs: string;
}): Promise<{ fullText: string; ok: true } | { message: string; ok: false }> {
  const bin = getCursorAgentBin();
  const child = spawn(bin, ["acp"], {
    cwd: input.rootAbs,
    env: { ...process.env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let nextId = 1;
  const pending: PendingMap = new Map();
  let stdoutBuffer = "";

  function sendLine(obj: Record<string, unknown>): void {
    const line = `${JSON.stringify(obj)}\n`;
    child.stdin.write(line);
  }

  function sendRequest(method: string, params: unknown): Promise<unknown> {
    const id = nextId;
    nextId += 1;
    return new Promise((resolve, reject) => {
      pending.set(id, { reject, resolve });
      sendLine({ id, jsonrpc: "2.0", method, params });
    });
  }

  const streamCtx: StreamCtx = {
    accumulated: "",
    onDelta: input.onDelta,
    phase: input.phase,
    sendLine,
    streamedCharCount: 0,
  };

  function onStdoutData(chunk: string | Buffer): void {
    const s = typeof chunk === "string" ? chunk : chunk.toString("utf8");
    stdoutBuffer += s;
    const parts = stdoutBuffer.split("\n");
    stdoutBuffer = parts.pop() ?? "";
    for (let i = 0; i < parts.length; i += 1) {
      const ln = parts[i];
      const trimmed = ln.trim();
      if (trimmed.length === 0) {
        continue;
      }
      processAcpLine(trimmed, pending, streamCtx);
    }
  }

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", onStdoutData);

  const [, initErr] = await tryCatchAsync(async () =>
    sendRequest("initialize", {
      clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
      clientInfo: { name: "vexkit-dashboard", version: "0.1.0" },
      protocolVersion: 1,
    }),
  );
  if (initErr != null) {
    child.kill();
    return { message: initErr.message, ok: false };
  }

  const [, authErr] = await tryCatchAsync(async () => sendRequest("authenticate", { methodId: "cursor_login" }));
  if (authErr != null) {
    child.kill();
    return { message: authErr.message, ok: false };
  }

  const [sessionResult, sessionErr] = await tryCatchAsync(async () =>
    sendRequest("session/new", { cwd: input.rootAbs, mcpServers: [] }),
  );
  if (sessionErr != null) {
    child.kill();
    return { message: sessionErr.message, ok: false };
  }
  if (!isRecord(sessionResult) || typeof sessionResult.sessionId !== "string") {
    child.kill();
    return { message: "ACP session/new returned invalid session.", ok: false };
  }
  const sessionId = sessionResult.sessionId;

  const [, promptErr] = await tryCatchAsync(async () =>
    sendRequest("session/prompt", {
      prompt: [{ text: input.promptText, type: "text" }],
      sessionId,
    }),
  );
  if (promptErr != null) {
    child.kill();
    return { message: promptErr.message, ok: false };
  }

  const [code, exitErr] = await tryCatchAsync(
    async () =>
      new Promise<number>((resolve, reject) => {
        const maxMs = 900_000;
        const timer = setTimeout(() => {
          child.kill("SIGTERM");
        }, maxMs);
        child.on("error", reject);
        child.on("close", (c) => {
          clearTimeout(timer);
          resolve(typeof c === "number" ? c : 1);
        });
      }),
  );
  if (exitErr != null) {
    return { message: exitErr.message, ok: false };
  }
  if (code !== 0 && streamCtx.accumulated.length === 0) {
    return { message: `Cursor agent exited with code ${String(code)}.`, ok: false };
  }

  if (streamCtx.streamedCharCount === 0 && streamCtx.accumulated.length > 0) {
    input.onDelta?.(streamCtx.accumulated);
  }

  return {
    fullText: streamCtx.accumulated.length > 0 ? streamCtx.accumulated : "(No text returned.)",
    ok: true,
  };
}

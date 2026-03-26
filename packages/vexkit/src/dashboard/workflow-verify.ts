import { tryCatchAsync } from "@vex-app/lib";
import { jsonResponse } from "./dashboard-helpers.js";

function appendLog(base: string, label: string, out: string, err: string, code: number | null): string {
  const exit = code == null ? "?" : String(code);
  const stderrBlock = err.length > 0 ? `\nstderr:\n${err}` : "";
  return `${base}\n\n--- ${label} (exit ${exit}) ---\n${out}${stderrBlock}`;
}

async function runBunScript(cwd: string, script: string): Promise<{ code: number; err: string; out: string }> {
  const proc = Bun.spawn(["bun", "run", script], {
    cwd,
    stderr: "pipe",
    stdout: "pipe",
  });
  const code = await proc.exited;
  const [stdout, stdoutErr] = await tryCatchAsync(async () => new Response(proc.stdout).text());
  const [stderr, stderrErr] = await tryCatchAsync(async () => new Response(proc.stderr).text());
  return {
    code,
    err: stderrErr != null ? "" : stderr,
    out: stdoutErr != null ? "" : stdout,
  };
}

async function runVerifyPipeline(rootAbs: string): Promise<{ log: string; ok: boolean }> {
  let log = "vexkit verify pipeline";

  const formatResult = await runBunScript(rootAbs, "format:check");
  log = appendLog(log, "format:check", formatResult.out, formatResult.err, formatResult.code);
  if (formatResult.code !== 0) {
    return { log, ok: false };
  }

  const eslintResult = await runBunScript(rootAbs, "lint:eslint");
  log = appendLog(log, "lint:eslint", eslintResult.out, eslintResult.err, eslintResult.code);
  if (eslintResult.code !== 0) {
    return { log, ok: false };
  }

  const typeResult = await runBunScript(rootAbs, "typecheck");
  log = appendLog(log, "typecheck", typeResult.out, typeResult.err, typeResult.code);
  if (typeResult.code !== 0) {
    return { log, ok: false };
  }

  return { log, ok: true };
}

export async function postWorkflowVerify(rootAbs: string): Promise<Response> {
  const [pipeline, pipeErr] = await tryCatchAsync(async () => runVerifyPipeline(rootAbs));
  if (pipeErr != null) {
    return jsonResponse({ message: pipeErr.message }, 500);
  }
  return jsonResponse({ log: pipeline.log, ok: pipeline.ok }, pipeline.ok ? 200 : 422);
}

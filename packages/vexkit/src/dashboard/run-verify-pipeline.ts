import { relative } from "bun:path";
import { tryCatchAsync } from "@vex-app/lib";
import { pairedSpecRelativePath } from "../spec-pair/spec-step-shape";
import { specSourceContainsItTodo } from "../spec-pair/scan-it-todo";
import { resolveReadablePathUnderRoot } from "./safe-readable-path";

function appendLog(base: string, label: string, out: string, err: string, code: number | null): string {
  const exit = code == null ? "?" : String(code);
  const stderrBlock = err.length > 0 ? `\nstderr:\n${err}` : "";
  const block = `\n\n--- ${label} (exit ${exit}) ---\n${out}${stderrBlock}`;
  return `${base}${block}`;
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

async function runSpecTestForVex(input: { rootAbs: string; vexRelativePath: string }): Promise<{
  code: number;
  err: string;
  out: string;
}> {
  const vexPath = input.vexRelativePath;
  if (!vexPath.endsWith(".vex")) {
    return { code: 1, err: "Not a .vex path.", out: "" };
  }
  const specRel = pairedSpecRelativePath(vexPath);
  if (specRel.length === 0) {
    return { code: 1, err: "Not a .vex path.", out: "" };
  }
  const specResolved = await resolveReadablePathUnderRoot({
    rawRelativePath: specRel,
    rootAbs: input.rootAbs,
  });
  if (specResolved.kind !== "ok") {
    return { code: 1, err: `Spec file not found: ${specRel}`, out: "" };
  }
  const specSource = await Bun.file(specResolved.absolutePath).text();
  if (specSourceContainsItTodo(specSource)) {
    return { code: 1, err: "Spec still contains it.todo.", out: "" };
  }
  const relFromRoot = relative(input.rootAbs, specResolved.absolutePath);
  const proc = Bun.spawn(["bun", "test", relFromRoot], {
    cwd: input.rootAbs,
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

export async function runVerifyPipeline(input: { currentVexPath: string; rootAbs: string }): Promise<{
  log: string;
  ok: boolean;
}> {
  const { currentVexPath, rootAbs } = input;
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

  if (currentVexPath.length > 0) {
    const specRun = await runSpecTestForVex({ rootAbs, vexRelativePath: currentVexPath });
    log = appendLog(log, `bun test (paired spec for ${currentVexPath})`, specRun.out, specRun.err, specRun.code);
    if (specRun.code !== 0) {
      return { log, ok: false };
    }
  }

  return { log, ok: true };
}

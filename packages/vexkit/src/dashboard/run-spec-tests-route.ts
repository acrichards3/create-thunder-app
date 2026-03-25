import { relative } from "bun:path";
import { tryCatchAsync } from "@vex-app/lib";
import { pairedSpecRelativePath } from "../spec-pair/spec-step-shape";
import { specSourceContainsItTodo } from "../spec-pair/scan-it-todo";
import { isRecord, jsonResponse } from "./dashboard-helpers.js";
import { resolveReadablePathUnderRoot } from "./safe-readable-path";

export async function serveRunSpecTests(input: { req: Request; rootAbs: string }): Promise<Response> {
  const [rawBody, bodyErr] = await tryCatchAsync(async () => input.req.json());
  if (bodyErr != null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  if (rawBody == null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  if (!isRecord(rawBody)) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  const pathRaw = rawBody.path;
  if (typeof pathRaw !== "string") {
    return jsonResponse({ message: "Missing or invalid .vex path." }, 400);
  }
  if (!pathRaw.endsWith(".vex")) {
    return jsonResponse({ message: "Missing or invalid .vex path." }, 400);
  }

  const specRel = pairedSpecRelativePath(pathRaw);
  if (specRel.length === 0) {
    return jsonResponse({ message: "Not a .vex path." }, 400);
  }

  const specResolved = await resolveReadablePathUnderRoot({ rawRelativePath: specRel, rootAbs: input.rootAbs });
  if (specResolved.kind !== "ok") {
    return jsonResponse({ message: `Spec file not found: ${specRel}`, ok: false }, 404);
  }

  const specSource = await Bun.file(specResolved.absolutePath).text();
  if (specSourceContainsItTodo(specSource)) {
    return jsonResponse({ message: "Spec still contains it.todo; finish tests before marking done.", ok: false }, 422);
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

  const out = stdoutErr != null ? "" : stdout;
  const err = stderrErr != null ? "" : stderr;

  if (code !== 0) {
    return jsonResponse({ code, ok: false, stderr: err, stdout: out }, 422);
  }

  return jsonResponse({ code, ok: true, stderr: err, stdout: out }, 200);
}

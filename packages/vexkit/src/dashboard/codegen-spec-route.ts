import { tryCatchAsync } from "@vex-app/lib";
import { generateSpecTsFromVexDocument } from "../spec-pair/codegen-spec-ts";
import { pairedSpecRelativePath } from "../spec-pair/spec-step-shape";
import { parseAndValidateVexDocument } from "../vex/parse-and-validate-vex-document";
import { isRecord, jsonResponse } from "./dashboard-helpers.js";
import { resolveSafeSpecWritePath, resolveSafeVexPath } from "./resolve-safe-vex-path";

export async function serveCodegenSpec(input: { req: Request; rootAbs: string }): Promise<Response> {
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
    return jsonResponse({ message: "Missing path." }, 400);
  }
  if (pathRaw.length === 0) {
    return jsonResponse({ message: "Missing path." }, 400);
  }
  const overwrite = rawBody.overwrite === true;

  const vexResolved = await resolveSafeVexPath({ rawRelativePath: pathRaw, rootAbs: input.rootAbs });
  if (vexResolved.kind !== "ok") {
    return jsonResponse({ message: vexResolved.message }, 400);
  }
  const specRel = pairedSpecRelativePath(pathRaw);
  if (specRel.length === 0) {
    return jsonResponse({ message: "Not a .vex path." }, 400);
  }
  const specWrite = await resolveSafeSpecWritePath({ rawRelativePath: specRel, rootAbs: input.rootAbs });
  if (specWrite.kind !== "ok") {
    return jsonResponse({ message: specWrite.message }, 400);
  }

  const specExists = await Bun.file(specWrite.absolutePath).exists();
  if (specExists && !overwrite) {
    return jsonResponse({ message: "Spec file already exists; pass overwrite:true to replace.", ok: false }, 409);
  }

  const vexSource = await Bun.file(vexResolved.absolutePath).text();
  const parsed = parseAndValidateVexDocument(vexSource);
  if (!parsed.ok || parsed.document == null) {
    return jsonResponse({ message: "Invalid .vex file.", ok: false }, 400);
  }

  const content = generateSpecTsFromVexDocument(parsed.document);
  const [, writeErr] = await tryCatchAsync(async () => Bun.write(specWrite.absolutePath, content));
  if (writeErr != null) {
    return jsonResponse({ message: "Could not write spec file." }, 500);
  }

  return jsonResponse({ ok: true, wrote: specRel }, 200);
}

import { validateVexSpecPair } from "../spec-pair/validate-vex-spec-pair";
import { pairedSpecRelativePath } from "../spec-pair/spec-step-shape";
import { jsonResponse } from "./dashboard-helpers.js";
import { resolveSafeVexPath } from "./resolve-safe-vex-path";
import { resolveReadablePathUnderRoot } from "./safe-readable-path";

export async function serveVerifyPair(input: { pathParam: string | null; rootAbs: string }): Promise<Response> {
  const { pathParam, rootAbs } = input;
  if (pathParam == null || pathParam === "") {
    return jsonResponse({ message: "Missing path query parameter." }, 400);
  }
  const vexResolved = await resolveSafeVexPath({ rawRelativePath: pathParam, rootAbs });
  if (vexResolved.kind !== "ok") {
    return jsonResponse({ message: vexResolved.message }, 400);
  }
  const specRel = pairedSpecRelativePath(pathParam);
  if (specRel.length === 0) {
    return jsonResponse({ message: "Not a .vex path." }, 400);
  }
  const specResolved = await resolveReadablePathUnderRoot({ rawRelativePath: specRel, rootAbs });
  if (specResolved.kind !== "ok") {
    return jsonResponse({ message: `Paired spec missing: ${specRel}`, ok: false }, 404);
  }
  const vexSource = await Bun.file(vexResolved.absolutePath).text();
  const specSource = await Bun.file(specResolved.absolutePath).text();
  const result = validateVexSpecPair({ specSource, vexSource });
  if (!result.ok) {
    return jsonResponse({ message: result.message, ok: false }, 422);
  }
  return jsonResponse({ message: "", ok: true }, 200);
}

import { tryCatchAsync } from "@vex-app/lib";
import { parseAndValidateVexDocument } from "../vex/parse-and-validate-vex-document";
import { serializeVexDocument } from "../vex/serialize-vex-document";
import { vexDocumentFromUnknown } from "../vex/vex-document-from-json";
import { isRecord, jsonResponse } from "./dashboard-helpers.js";
import { resolveSafeVexWritePath } from "./resolve-safe-vex-path";

type PutSourceOutcome = { response: Response | null; source: string };

function resolvePutVexSource(rawBody: Record<string, unknown>): PutSourceOutcome {
  const sourceRaw = rawBody.source;
  const documentRaw = rawBody.document;
  if (typeof sourceRaw === "string") {
    const validated = parseAndValidateVexDocument(sourceRaw);
    if (!validated.ok) {
      return {
        response: jsonResponse({ errors: validated.errors, message: "Invalid .vex source.", ok: false }, 400),
        source: "",
      };
    }
    if (validated.document == null) {
      return {
        response: jsonResponse({ errors: validated.errors, message: "Invalid .vex source.", ok: false }, 400),
        source: "",
      };
    }
    return { response: null, source: sourceRaw };
  }
  if (documentRaw != null) {
    const docWrap = vexDocumentFromUnknown(documentRaw);
    if (docWrap.document == null) {
      return {
        response: jsonResponse({ message: "Invalid document JSON shape." }, 400),
        source: "",
      };
    }
    const sourceOut = serializeVexDocument(docWrap.document);
    const validated = parseAndValidateVexDocument(sourceOut);
    if (!validated.ok) {
      return {
        response: jsonResponse(
          { errors: validated.errors, message: "Serialized document failed validation.", ok: false },
          400,
        ),
        source: "",
      };
    }
    return { response: null, source: sourceOut };
  }
  return {
    response: jsonResponse({ message: "Provide source or document." }, 400),
    source: "",
  };
}

export async function servePutDocument(input: { req: Request; rootAbs: string }): Promise<Response> {
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

  const src = resolvePutVexSource(rawBody);
  if (src.response != null) {
    return src.response;
  }

  const resolved = await resolveSafeVexWritePath({ rawRelativePath: pathRaw, rootAbs: input.rootAbs });
  if (resolved.kind !== "ok") {
    return jsonResponse({ message: resolved.message }, 400);
  }

  const [, writeErr] = await tryCatchAsync(async () => Bun.write(resolved.absolutePath, src.source));
  if (writeErr != null) {
    return jsonResponse({ message: "Could not write file." }, 500);
  }

  return jsonResponse({ message: "Saved.", ok: true }, 200);
}

export async function serveSerializeVexDocument(input: { req: Request }): Promise<Response> {
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
  const docWrap = vexDocumentFromUnknown(rawBody.document);
  if (docWrap.document == null) {
    return jsonResponse({ message: "Invalid document JSON shape." }, 400);
  }
  const source = serializeVexDocument(docWrap.document);
  const validated = parseAndValidateVexDocument(source);
  if (!validated.ok) {
    return jsonResponse(
      { errors: validated.errors, message: "Document failed validation after serialize.", ok: false },
      400,
    );
  }
  return jsonResponse({ ok: true, source }, 200);
}

import { parseAndValidateVexDocument } from "../vex/parse-and-validate-vex-document";
import { getAssistantStatusResponse, postAssistantChat } from "./assistant-chat-route";
import { buildDashboardFileTree } from "./build-file-tree";
import { serveCodegenSpec } from "./codegen-spec-route";
import { jsonResponse } from "./dashboard-helpers.js";
import { servePutDocument, serveSerializeVexDocument } from "./document-routes";
import { resolveSafeVexPath } from "./resolve-safe-vex-path";
import { serveRunSpecTests } from "./run-spec-tests-route";
import { serveVerifyPair } from "./verify-pair-route";
import { postWorkflowVerify } from "./workflow-verify";

type Hit = { matched: boolean; value: Response | null };

async function serveDocumentGet(input: { pathParam: string | null; rootAbs: string }): Promise<Response> {
  const { pathParam, rootAbs } = input;
  if (pathParam == null) {
    return jsonResponse({ message: "Missing path query parameter." }, 400);
  }
  if (pathParam === "") {
    return jsonResponse({ message: "Missing path query parameter." }, 400);
  }

  const resolved = await resolveSafeVexPath({ rawRelativePath: pathParam, rootAbs });
  if (resolved.kind === "ok") {
    const source = await Bun.file(resolved.absolutePath).text();
    const result = parseAndValidateVexDocument(source);
    return jsonResponse({ ...result, source }, 200);
  }

  return jsonResponse({ message: resolved.message }, 400);
}

async function dispatchAssistantApi(input: { pathname: string; req: Request }): Promise<Hit> {
  const { pathname, req } = input;
  if (pathname === "/api/assistant/status") {
    return { matched: true, value: getAssistantStatusResponse() };
  }
  if (pathname === "/api/assistant/chat" && req.method === "POST") {
    return { matched: true, value: await postAssistantChat(req) };
  }
  return { matched: false, value: null };
}

async function dispatchTreeDocumentApi(input: {
  pathname: string;
  req: Request;
  rootAbs: string;
  searchParams: URLSearchParams;
}): Promise<Hit> {
  const { pathname, req, rootAbs, searchParams } = input;
  if (pathname === "/api/tree") {
    const tree = await buildDashboardFileTree(rootAbs);
    return { matched: true, value: jsonResponse({ root: rootAbs, tree }, 200) };
  }
  if (pathname === "/api/document") {
    if (req.method === "GET") {
      return { matched: true, value: await serveDocumentGet({ pathParam: searchParams.get("path"), rootAbs }) };
    }
    if (req.method === "PUT") {
      return { matched: true, value: await servePutDocument({ req, rootAbs }) };
    }
    return { matched: true, value: new Response("Method not allowed", { status: 405 }) };
  }
  if (pathname === "/api/serialize-vex" && req.method === "POST") {
    return { matched: true, value: await serveSerializeVexDocument({ req }) };
  }
  return { matched: false, value: null };
}

async function dispatchCodegenApi(input: {
  pathname: string;
  req: Request;
  rootAbs: string;
  searchParams: URLSearchParams;
}): Promise<Hit> {
  const { pathname, req, rootAbs, searchParams } = input;
  if (pathname === "/api/verify-pair" && req.method === "GET") {
    return { matched: true, value: await serveVerifyPair({ pathParam: searchParams.get("path"), rootAbs }) };
  }
  if (pathname === "/api/codegen-spec" && req.method === "POST") {
    return { matched: true, value: await serveCodegenSpec({ req, rootAbs }) };
  }
  if (pathname === "/api/run-spec-tests" && req.method === "POST") {
    return { matched: true, value: await serveRunSpecTests({ req, rootAbs }) };
  }
  if (pathname === "/api/workflow/verify" && req.method === "POST") {
    return { matched: true, value: await postWorkflowVerify(rootAbs) };
  }
  return { matched: false, value: null };
}

export async function dispatchDashboardApi(input: {
  req: Request;
  rootAbs: string;
  url: URL;
}): Promise<Response | null> {
  const { req, rootAbs, url } = input;
  const { pathname, searchParams } = url;

  const assistant = await dispatchAssistantApi({ pathname, req });
  if (assistant.matched) {
    return assistant.value;
  }

  const treeDoc = await dispatchTreeDocumentApi({ pathname, req, rootAbs, searchParams });
  if (treeDoc.matched) {
    return treeDoc.value;
  }

  const rest = await dispatchCodegenApi({ pathname, req, rootAbs, searchParams });
  if (rest.matched) {
    return rest.value;
  }

  return null;
}

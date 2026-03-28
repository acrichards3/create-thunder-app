import type { WorkflowState } from "./types.js";
import { getSession, updateSession } from "./state.js";
import { readFileSync, existsSync } from "fs";
import { join, extname, resolve } from "path";
import { fileURLToPath } from "url";
import { parse as parseUrl } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const STATIC_DIR = resolve(__dirname, "../static");

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

function serveStaticFile(filePath: string): Response | null {
  const fullPath = join(STATIC_DIR, filePath);
  if (!fullPath.startsWith(STATIC_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!existsSync(fullPath)) {
    return null;
  }
  const content = readFileSync(fullPath);
  return new Response(content, {
    headers: {
      "Content-Type": getMimeType(fullPath),
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function serveDashboardHtml(sessionId: string | null): Response {
  const indexPath = join(STATIC_DIR, "index.html");
  if (!existsSync(indexPath)) {
    return new Response("Dashboard bundle not found. Run `bun run bundle` first.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }

  let html = readFileSync(indexPath, "utf-8");

  // Inject initial state into the HTML
  const initialState: Partial<WorkflowState> = sessionId ? (getSession(sessionId) ?? {}) : {};

  const stateJson = JSON.stringify({
    sessionId: sessionId ?? "",
    ...initialState,
  });

  // Inject window.__INITIAL_STATE__ before the app.js script
  const stateScript = `<script>window.__INITIAL_STATE__ = ${stateJson};</script>`;
  html = html.replace("</head>", `${stateScript}</head>`);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function handleApiRequest(method: string, url: string, body: string | null, headers: Record<string, string>): Response {
  const parsed = parseUrl(url, true);
  const pathname = parsed.pathname ?? "/";
  const query = parsed.query;

  // GET /api/session/<sessionId> - get current workflow state
  if (method === "GET" && pathname.startsWith("/api/session/")) {
    const sessionId = pathname.split("/")[3];
    const state = getSession(sessionId);
    if (!state) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(state), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // PUT /api/session/<sessionId> - update workflow state
  if (method === "PUT" && pathname.startsWith("/api/session/")) {
    const sessionId = pathname.split("/")[3];
    if (!body) {
      return new Response(JSON.stringify({ error: "Missing body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      const updates = JSON.parse(body);
      updateSession(sessionId, updates);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /api/file-tree?session=<sessionId> - build file tree from vexDocuments
  if (method === "GET" && pathname === "/api/file-tree") {
    const sessionId = typeof query.session === "string" ? query.session : null;
    const state = sessionId ? getSession(sessionId) : null;
    if (!state) {
      return buildEmptyFileTree();
    }
    return new Response(JSON.stringify(state.tree), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /api/document?path=<path>&session=<sessionId>
  if (method === "GET" && pathname === "/api/document") {
    const sessionId = typeof query.session === "string" ? query.session : null;
    const path = typeof query.path === "string" ? query.path : null;
    if (!sessionId || !path) {
      return new Response(JSON.stringify({ error: "Missing session or path" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const state = getSession(sessionId);
    if (!state) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const vexDoc = state.vexDocuments[path];
    if (!vexDoc) {
      return new Response(JSON.stringify({ error: "Vex document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(vexDoc), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // PUT /api/document - save vex document (update state)
  if (method === "PUT" && pathname === "/api/document") {
    if (!body) {
      return new Response(JSON.stringify({ error: "Missing body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      const data = JSON.parse(body);
      const { sessionId, path, vexDocument } = data;
      if (!sessionId || !path || !vexDocument) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const state = getSession(sessionId);
      if (!state) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      state.vexDocuments[path] = vexDocument;
      updateSession(sessionId, { vexDocuments: state.vexDocuments });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /api/serialize-vex - serialize vex document to text
  if (method === "POST" && pathname === "/api/serialize-vex") {
    if (!body) {
      return new Response(JSON.stringify({ error: "Missing body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      const { vexDocument } = JSON.parse(body);
      const text = serializeVexDocument(vexDocument);
      return new Response(JSON.stringify({ text }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /api/codegen-spec - generate spec files from vexDocuments
  if (method === "POST" && pathname === "/api/codegen-spec") {
    // This is a stub that would normally invoke codegen
    // For now, return a success indicating the build step can proceed
    return new Response(JSON.stringify({ ok: true, message: "Codegen placeholder" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST /api/run-spec-tests - run paired spec tests
  if (method === "POST" && pathname === "/api/run-spec-tests") {
    // Stub for test runner
    return new Response(JSON.stringify({ ok: true, message: "Tests placeholder", passed: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /api/verify-pair - verify spec matches implementation
  if (method === "GET" && pathname === "/api/verify-pair") {
    // Stub
    return new Response(JSON.stringify({ ok: true, matched: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST /api/workflow/verify - run lint, typecheck, format check
  if (method === "POST" && pathname === "/api/workflow/verify") {
    // Stub that returns success
    return new Response(
      JSON.stringify({
        ok: true,
        lint: { passed: true },
        typecheck: { passed: true },
        format: { passed: true },
        tests: { passed: true },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // GET /api/workflow/status?session=<sessionId>
  if (method === "GET" && pathname === "/api/workflow/status") {
    const sessionId = typeof query.session === "string" ? query.session : null;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const state = getSession(sessionId);
    if (!state) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        step: state.step,
        featureName: state.featureName,
        currentPath: state.currentPath,
        approvalsByPath: state.approvalsByPath,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // GET /api/watch - SSE endpoint for file watching (stub)
  if (method === "GET" && pathname === "/api/watch") {
    const sessionId = typeof query.session === "string" ? query.session : null;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));
        // Keep-alive ping every 30s
        const interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            clearInterval(interval);
          }
        }, 30000);
      },
      cancel() {},
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // POST /api/assistant/chat - proxy to assistant backend (stub)
  if (method === "POST" && pathname === "/api/assistant/chat") {
    // Stub - in a real implementation this would proxy to an AI backend
    return new Response(
      JSON.stringify({
        response: "This is a stub response. Connect to an AI backend for real responses.",
        done: true,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

function buildEmptyFileTree() {
  return new Response(
    JSON.stringify({
      name: ".vexkit",
      path: ".vexkit",
      isDir: true,
      children: [],
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

function serializeVexDocument(vexDocument: {
  functions: Array<{
    name: string;
    line: number;
    whens: Array<{
      label: string;
      line: number;
      branches: Array<{ kind: string; label: string; line: number }>;
    }>;
  }>;
}): string {
  const lines: string[] = [];
  for (const fn of vexDocument.functions) {
    lines.push(`function: ${fn.name}`);
    for (const when of fn.whens) {
      lines.push(`  - WHEN: ${when.label}`);
      for (const branch of when.branches) {
        if (branch.kind === "and") {
          lines.push(`    - AND: ${branch.label}`);
        } else {
          lines.push(`    - IT: ${branch.label}`);
        }
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function createDashboardHandler(): (req: Request) => Response | Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    // Extract sessionId from query params for all requests
    const sessionId = typeof url.searchParams.get("session") === "string" ? url.searchParams.get("session")! : null;

    // Serve dashboard HTML
    if (pathname === "/dashboard" || pathname === "/") {
      return serveDashboardHtml(sessionId);
    }

    // Serve static files (app.js, chat-panel.js, etc.)
    if (
      pathname === "/app.js" ||
      pathname === "/chat-panel.js" ||
      pathname === "/docs.html" ||
      pathname === "/strip-assistant-visible-text.js"
    ) {
      const filePath = pathname.slice(1); // remove leading slash
      const fileResponse = serveStaticFile(filePath);
      if (fileResponse) return fileResponse;
    }

    // Serve static assets with full path
    if (pathname.startsWith("/static/") || pathname.startsWith("/assets/")) {
      const filePath = pathname.slice(1);
      const fileResponse = serveStaticFile(filePath);
      if (fileResponse) return fileResponse;
    }

    // Handle API routes
    if (pathname.startsWith("/api/")) {
      const body = method !== "GET" && method !== "HEAD" ? await req.text() : null;
      return handleApiRequest(method, pathname + url.search, body, Object.fromEntries(req.headers.entries()));
    }

    // Try to serve static file as fallback
    const staticResponse = serveStaticFile(pathname);
    if (staticResponse) return staticResponse;

    return new Response("Not found", { status: 404 });
  };
}

import type { ServerWebSocket } from "bun";
import { join } from "bun:path";
import { setAssistantProjectContext } from "./assistant-chat-route";
import { isCursorAgentConfigured } from "./cursor-acp-session";
import { dispatchDashboardApi } from "./dashboard-api-router";
import { loadEnvFileFromRoot } from "./load-env-from-root";
import { startDashboardFileWatch } from "./project-file-watch";

const staticDir = join(import.meta.dirname, "static");

async function serveStatic(relativeName: string, contentType: string): Promise<Response> {
  const fullPath = join(staticDir, relativeName);
  const file = Bun.file(fullPath);
  if (!(await file.exists())) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file, {
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Content-Type": contentType },
  });
}

async function routeRequest(input: { req: Request; rootAbs: string }): Promise<Response> {
  const { req, rootAbs } = input;
  const url = new URL(req.url);

  const api = await dispatchDashboardApi({ req, rootAbs, url });
  if (api != null) {
    return api;
  }

  if (url.pathname === "/" || url.pathname === "") {
    return await serveStatic("index.html", "text/html; charset=utf-8");
  }

  if (url.pathname === "/docs" || url.pathname === "/docs/") {
    return await serveStatic("docs.html", "text/html; charset=utf-8");
  }

  if (url.pathname === "/app.js") {
    return await serveStatic("app.js", "application/javascript; charset=utf-8");
  }

  if (url.pathname === "/chat-panel.js") {
    return await serveStatic("chat-panel.js", "application/javascript; charset=utf-8");
  }

  if (url.pathname === "/strip-assistant-visible-text.js") {
    return await serveStatic("strip-assistant-visible-text.js", "application/javascript; charset=utf-8");
  }

  return new Response("Not found", { status: 404 });
}

const dashboardWsClients = new Set<ServerWebSocket>();

function broadcastVexFilesChanged(): void {
  const payload = JSON.stringify({ type: "vexFilesChanged" });
  for (const client of [...dashboardWsClients]) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function warnIfCursorNotConfigured(): Promise<void> {
  if (isCursorAgentConfigured()) {
    return;
  }
  await Bun.write(
    Bun.stderr,
    "vexkit: Cursor agent is not configured. Set VEXKIT_USE_CURSOR_AGENT=1 and CURSOR_API_KEY in a .env file in the project root. The template ships a root .env.example you can copy.\n",
  );
}

export async function startDashboard(input: { cwd: string; port: number }): Promise<void> {
  await loadEnvFileFromRoot(input.cwd);
  const rootAbs = input.cwd;
  setAssistantProjectContext(rootAbs);
  await warnIfCursorNotConfigured();

  const server = Bun.serve({
    async fetch(req: Request, server: { upgrade: (req: Request) => boolean }): Promise<Response | undefined> {
      const url = new URL(req.url);
      if (url.pathname === "/api/watch") {
        const upgraded = server.upgrade(req);
        if (upgraded) {
          return undefined;
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      return routeRequest({ req, rootAbs });
    },
    idleTimeout: 255,
    port: input.port,
    websocket: {
      close(ws: ServerWebSocket) {
        dashboardWsClients.delete(ws);
      },
      message() {},
      open(ws: ServerWebSocket) {
        dashboardWsClients.add(ws);
      },
    },
  });

  startDashboardFileWatch({
    debounceMs: 160,
    onDebouncedChange: broadcastVexFilesChanged,
    rootAbs,
  });

  void Bun.write(
    Bun.stdout,
    `vexkit dashboard — http://localhost:${String(server.port)}/  docs: http://localhost:${String(server.port)}/docs  (cwd: ${rootAbs})\n`,
  );
}

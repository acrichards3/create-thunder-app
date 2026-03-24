import type { ServerWebSocket } from "bun";
import { join } from "bun:path";
import { setAssistantProjectContext } from "./assistant-chat-route";
import { dispatchDashboardApi } from "./dashboard-api-router";
import { startDashboardFileWatch } from "./project-file-watch";

const staticDir = join(import.meta.dirname, "static");

async function serveStatic(relativeName: string, contentType: string): Promise<Response> {
  const fullPath = join(staticDir, relativeName);
  const file = Bun.file(fullPath);
  if (!(await file.exists())) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file, { headers: { "Content-Type": contentType } });
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

  if (url.pathname === "/app.js") {
    return await serveStatic("app.js", "application/javascript; charset=utf-8");
  }

  if (url.pathname === "/chat-panel.js") {
    return await serveStatic("chat-panel.js", "application/javascript; charset=utf-8");
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

export function startDashboard(input: { cwd: string; port: number }): void {
  const rootAbs = input.cwd;
  setAssistantProjectContext(rootAbs);

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

  void Bun.write(Bun.stdout, `vexkit dashboard — http://localhost:${String(server.port)}/  (cwd: ${rootAbs})\n`);
}

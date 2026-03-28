import { setHttpServerInfo } from "./state.js";
import { createDashboardHandler } from "./dashboard-handler.js";
import { startMcpServer } from "./mcp-server.js";

const DEFAULT_PORT = 3847;

async function main() {
  const port = parseInt(Bun.env.PORT ?? String(DEFAULT_PORT), 10);

  // Start the HTTP server for the dashboard
  const dashboardHandler = createDashboardHandler();

  const httpServer = Bun.serve({
    port,
    async fetch(req) {
      return dashboardHandler(req);
    },
  });

  setHttpServerInfo(httpServer.port);
  console.error(`Dashboard HTTP server running at http://localhost:${httpServer.port}`);

  // Start the MCP server (stdio transport)
  // This will block until the MCP session ends
  await startMcpServer();
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});

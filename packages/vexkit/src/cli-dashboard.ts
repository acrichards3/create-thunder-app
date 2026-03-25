import { cwd as getCwd } from "bun:process";
import { startDashboard } from "./dashboard/start-dashboard";

function parseDashboardPort(argv: string[]): number {
  let port = 8888;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--port" && i + 1 < argv.length) {
      const next = Number(argv[i + 1]);
      if (Number.isFinite(next) && next > 0 && next < 65536) {
        port = Math.floor(next);
      }
      i += 1;
    }
  }
  return port;
}

export async function runDashboardCommand(argv: string[]): Promise<void> {
  const port = parseDashboardPort(argv);
  await startDashboard({ cwd: getCwd(), port });
}

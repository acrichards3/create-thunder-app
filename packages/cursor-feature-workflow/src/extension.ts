import { Disposable, commands, window, workspace } from "vscode";
import { DashboardPanel } from "./dashboard-panel.js";
import { BunServer } from "./bun-server.js";

let dashboardPanel: DashboardPanel | undefined;
let bunServer: BunServer | undefined;
const disposables: Disposable[] = [];

export function activate() {
  // Register command to open the dashboard
  disposables.push(
    commands.registerCommand("feature-workflow.open", async () => {
      try {
        const folder = workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (folder === undefined) {
          await window.showErrorMessage("Feature Workflow: open a folder in the workspace first.");
          return;
        }
        if (!bunServer) {
          bunServer = new BunServer();
          await bunServer.start(folder);
        }
        if (!dashboardPanel) {
          dashboardPanel = new DashboardPanel(bunServer.baseUrl, bunServer.sessionId);
        }
        dashboardPanel.reveal();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Feature workflow error:", msg);
        await window.showErrorMessage(`Feature Workflow failed: ${msg}`);
      }
    }),
  );
}

export function deactivate() {
  dashboardPanel?.dispose();
  bunServer?.stop();
  for (const d of disposables) {
    d.dispose();
  }
}

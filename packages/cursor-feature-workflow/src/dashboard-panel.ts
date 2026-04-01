import { window, workspace, WebviewPanel, ViewColumn, Disposable, Uri } from "vscode";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { DashboardState } from "./types.js";
import type { IncomingMsg, OutgoingMsg } from "./state-sync.js";
import { ApiProxy } from "./api-proxy.js";

const FETCH_SHIM = readFileSync(join(__dirname, "../media/ext-fetch-shim.js"), "utf-8");

export class DashboardPanel {
  private panel: WebviewPanel;
  private disposables: Disposable[] = [];
  private apiProxy: ApiProxy;

  constructor(
    private baseUrl: string,
    private sessionId: string,
  ) {
    this.apiProxy = new ApiProxy(baseUrl);

    this.panel = window.createWebviewPanel(
      "featureWorkflow",
      "Feature Workflow",
      { viewColumn: ViewColumn.Two, preserveFocus: true },
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(join(__dirname, "../media"))],
        retainContextWhenHidden: true,
      },
    );

    this.panel.webview.html = this.buildHtml();

    this.registerIdeVexSync();
    this.disposables.push(
      this.panel.onDidChangeViewState((e) => {
        if (e.webviewPanel.visible) {
          this.pushActiveVexToWebview();
        }
      }),
    );

    this.panel.webview.onDidReceiveMessage(
      (msg: OutgoingMsg) => {
        void this.handleMessage(msg);
      },
      null,
      this.disposables,
    );
  }

  private buildHtml(): string {
    const mediaDir = join(__dirname, "../media");

    // Load bundled JS files
    const appJs = existsSync(join(mediaDir, "app.js")) ? readFileSync(join(mediaDir, "app.js"), "utf-8") : "";
    const chatJs = existsSync(join(mediaDir, "chat-panel.js"))
      ? readFileSync(join(mediaDir, "chat-panel.js"), "utf-8")
      : "";

    // Load HTML and extract just the body content and CSS
    let dashboardHtml = "";
    let dashboardCss = "";

    try {
      const htmlPath = join(mediaDir, "index.html");
      const fullHtml = readFileSync(htmlPath, "utf-8");

      // Extract CSS from <style> block
      const cssMatch = /<style>([\s\S]*?)<\/style>/.exec(fullHtml);
      if (cssMatch) {
        dashboardCss = cssMatch[1];
      }

      // Extract body content (everything inside <body> except scripts)
      const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/.exec(fullHtml);
      if (bodyMatch) {
        // Remove script tags from body
        dashboardHtml = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/g, "");
        dashboardHtml = dashboardHtml.replace(
          '<p class="placeholder" id="hint">Select a <code>.vex</code> file in the sidebar.</p>',
          '<p class="placeholder" id="hint">Pick a file from the header list or focus a <code>.vex</code> tab in the editor.</p>',
        );
        dashboardHtml = dashboardHtml.replace(
          "Open files in the sidebar as needed; the current file is just the focused tree.",
          "Open files from the Cursor file tree as needed; the current file is just the focused tree.",
        );
      }
    } catch {
      dashboardHtml = '<div style="padding:2rem;color:#e07070">Dashboard not found. Run `bun run bundle` first.</div>';
    }

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <style>
${dashboardCss}
  </style>
  <style>
    html, body { height: 100%; overflow: hidden; }
    body.feature-workflow-ide #sidebar-shell,
    body.feature-workflow-ide #toggle-explorer {
      display: none !important;
    }
    body.feature-workflow-ide #assistant-messages,
    body.feature-workflow-ide #assistant-form,
    body.feature-workflow-ide #assistant-activity-row,
    body.feature-workflow-ide #assistant-model-confirm {
      display: none !important;
    }
    body.feature-workflow-ide {
      --assistant-width: min(220px, 26vw);
    }
    body.feature-workflow-ide .assistant-shell {
      max-width: min(240px, 28vw);
      min-width: min(180px, 24vw);
      width: var(--assistant-width, min(220px, 26vw));
    }
    body.feature-workflow-ide .workflow-stepper-bar {
      background: var(--panel);
      display: block !important;
      flex-shrink: 0;
      min-height: 3.75rem;
      visibility: visible;
    }
    body.feature-workflow-ide .workflow-stepper-bar .stepper-track {
      min-height: 3.25rem;
    }
  </style>
</head>
<body class="feature-workflow-ide">
<script>
window.__FEATURE_WORKFLOW_IDE_EMBED = true;
</script>
${dashboardHtml}
<script>
// Fetch shim - intercepts /api/* calls and routes via postMessage
${FETCH_SHIM}
</script>
<script>
// chat-panel.js bundle
${chatJs}
</script>
<script>
// app.js bundle
${appJs}
</script>
<script>
try {
  globalThis.__VEXKIT_VSCODE = acquireVsCodeApi();
  globalThis.__VEXKIT_VSCODE.postMessage({ type: "ready" });
} catch {
  globalThis.__VEXKIT_VSCODE = null;
}
</script>
<script>
(function () {
  window.addEventListener("message", function (ev) {
    var d = ev.data;
    if (d == null || d.type !== "load-vex" || typeof d.path !== "string") {
      return;
    }
    var fn = window.__vexkitOpenVexFile;
    if (typeof fn === "function") {
      fn(d.path);
    }
  });
})();
</script>
</body>
</html>`;
  }

  private registerIdeVexSync(): void {
    this.disposables.push(
      window.onDidChangeActiveTextEditor(() => {
        this.pushActiveVexToWebview();
      }),
    );
    setTimeout(() => {
      this.pushActiveVexToWebview();
    }, 400);
  }

  private pushActiveVexToWebview(): void {
    const editor = window.activeTextEditor;
    if (editor === undefined) {
      return;
    }
    const doc = editor.document;
    if (doc.uri.scheme !== "file") {
      return;
    }
    if (!doc.fileName.endsWith(".vex")) {
      return;
    }
    const wf = workspace.getWorkspaceFolder(doc.uri);
    if (wf === undefined) {
      return;
    }
    const rel = workspace.asRelativePath(doc.uri, false);
    if (rel.length === 0 || rel.includes("..")) {
      return;
    }
    const normalized = rel.replaceAll("\\", "/");
    this.panel.webview.postMessage({ type: "load-vex", path: normalized });
  }

  private sendInit(): void {
    const initialState: DashboardState = {
      workflowStep: 0,
      currentPath: null,
      tree: [],
      parseResult: null,
      approvalsByPath: {},
      selectedFnIndex: 0,
      expandedDirs: [],
      vexSource: "",
    };

    const initMsg: IncomingMsg = {
      type: "init",
      state: initialState,
      baseUrl: this.baseUrl,
      sessionId: this.sessionId,
    };

    this.panel.webview.postMessage(initMsg);
  }

  private async handleMessage(msg: OutgoingMsg): Promise<void> {
    switch (msg.type) {
      case "ready": {
        this.sendInit();
        this.pushActiveVexToWebview();
        break;
      }

      case "api-request": {
        const result = await this.apiProxy.handleApiRequest(msg.requestId, msg.method, msg.url, msg.body);
        const response: IncomingMsg = {
          type: "api-response",
          requestId: result.requestId,
          ok: result.ok,
          body: result.body,
        };
        this.panel.webview.postMessage(response);
        break;
      }

      case "open-file": {
        const folder = workspace.workspaceFolders?.[0];
        if (folder === undefined) {
          break;
        }
        const segments = msg.path.split(/[/\\]/u).filter((s) => s.length > 0);
        const fileUri = segments.reduce((acc, seg) => Uri.joinPath(acc, seg), folder.uri);
        const doc = await workspace.openTextDocument(fileUri);
        await window.showTextDocument(doc, { viewColumn: ViewColumn.One });
        break;
      }

      case "session-update":
      case "state-update":
      case "workflow-step-change":
      case "node-edit": {
        break;
      }
    }
  }

  reveal(): void {
    this.panel.reveal();
  }

  dispose(): void {
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}

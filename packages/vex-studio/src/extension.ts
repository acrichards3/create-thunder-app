import type { ExtensionContext, WebviewView } from "vscode";
import * as vscode from "vscode";
import { readComposerState } from "./cursor-state-reader";
import type { ComposerState } from "./cursor-state-reader";
import { buildStepperHtml } from "./stepper-html";
import { createVexTreeEditorProvider } from "./vex-tree-editor-provider";

const VIEW_ID = "vex.panel.stepper";
const VEX_TREE_VIEW_TYPE = "vex.tree";
const POLL_MS = 2000;

async function openVexTreeEditorForActiveFile(): Promise<void> {
  const doc = vscode.window.activeTextEditor?.document;
  if (doc == null) {
    await vscode.window.showInformationMessage("Open a .vex file first.");
    return;
  }
  if (doc.languageId !== "vex" && !doc.uri.fsPath.toLowerCase().endsWith(".vex")) {
    await vscode.window.showInformationMessage("Open a .vex file first.");
    return;
  }
  await vscode.commands.executeCommand("vscode.openWith", doc.uri, VEX_TREE_VIEW_TYPE, {
    viewColumn: vscode.ViewColumn.Active,
  });
}

function stateChanged(prev: ComposerState | null, next: ComposerState): boolean {
  if (prev == null) {
    return true;
  }
  if (prev.activeId !== next.activeId) {
    return true;
  }
  if (prev.tabs.length !== next.tabs.length) {
    return true;
  }
  for (let i = 0; i < prev.tabs.length; i++) {
    if (prev.tabs[i].composerId !== next.tabs[i].composerId) {
      return true;
    }
    if (prev.tabs[i].name !== next.tabs[i].name) {
      return true;
    }
  }
  return false;
}

export function activate(context: ExtensionContext): void {
  const vexTreeProvider = createVexTreeEditorProvider(context);

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VEX_TREE_VIEW_TYPE, vexTreeProvider, {
      supportsMultipleEditorsPerDocument: false,
      webviewOptions: {
        retainContextWhenHidden: false,
      },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vex.panel.openEditorVisual", () => {
      return openVexTreeEditorForActiveFile();
    }),
  );

  let activeWebviewView: WebviewView | undefined;
  let lastState: ComposerState | null = null;
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  function sendState(webviewView: WebviewView, state: ComposerState): void {
    void webviewView.webview.postMessage({
      activeId: state.activeId,
      tabs: state.tabs,
      type: "composerState",
    });
  }

  async function poll(): Promise<void> {
    if (activeWebviewView == null) {
      return;
    }
    let state: ComposerState;
    try {
      state = await readComposerState(context);
    } catch {
      state = { activeId: null, tabs: [] };
    }
    if (stateChanged(lastState, state)) {
      lastState = state;
      sendState(activeWebviewView, state);
    }
  }

  function startPolling(): void {
    if (pollTimer != null) {
      return;
    }
    void poll();
    pollTimer = setInterval(() => {
      void poll();
    }, POLL_MS);
  }

  function stopPolling(): void {
    if (pollTimer != null) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  }

  const provider = {
    resolveWebviewView(webviewView: WebviewView): void {
      activeWebviewView = webviewView;
      webviewView.webview.options = {
        enableScripts: true,
      };
      webviewView.webview.html = buildStepperHtml();

      webviewView.webview.onDidReceiveMessage((message: { type?: string }) => {
        if (message.type === "openEditorVisual") {
          void openVexTreeEditorForActiveFile();
        }
        if (message.type === "requestState") {
          void poll();
        }
        if (message.type === "refreshWindow") {
          void vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      });

      webviewView.onDidDispose(() => {
        if (activeWebviewView === webviewView) {
          activeWebviewView = undefined;
          stopPolling();
        }
      });

      startPolling();
    },
  };

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(VIEW_ID, provider));
  context.subscriptions.push({ dispose: stopPolling });
}

export function deactivate(): void {}

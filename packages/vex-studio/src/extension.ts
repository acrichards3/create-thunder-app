import type { ExtensionContext, WebviewView } from "vscode";
import * as vscode from "vscode";
import { readComposerState } from "./cursor-state-reader";
import type { ComposerState } from "./cursor-state-reader";
import { buildStepperHtml } from "./stepper-html";
import { createVexTreeEditorProvider } from "./vex-tree-editor-provider";
import { lintAllVexFiles } from "./workflow-vex-lint";
import { readWorkflowState } from "./workflow-state";
import { cleanupWorkflowFiles, syncWorkflowToFiles } from "./workflow-sync";

const VIEW_ID = "vex.panel.stepper";
const VEX_TREE_VIEW_TYPE = "vex.tree";
const POLL_MS = 2000;
const STATE_KEY_STEPS = "vex.stepByTabId";
const STATE_KEY_ENABLED = "vex.workflowEnabled";

function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (folders == null || folders.length === 0) {
    return "";
  }
  return folders[0].uri.fsPath;
}

function resolveStep(activeId: string | null, steps: Record<string, number>): number {
  if (activeId === null) {
    return 0;
  }
  return steps[activeId] ?? 0;
}

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

function composerStateChanged(prev: ComposerState | null, next: ComposerState): boolean {
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
  const root = getWorkspaceRoot();

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VEX_TREE_VIEW_TYPE, createVexTreeEditorProvider(context), {
      supportsMultipleEditorsPerDocument: false,
      webviewOptions: { retainContextWhenHidden: false },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vex.panel.openEditorVisual", () => openVexTreeEditorForActiveFile()),
  );

  let stepByTabId: Record<string, number> = context.globalState.get(STATE_KEY_STEPS) ?? {};
  let workflowEnabled: boolean = context.globalState.get(STATE_KEY_ENABLED) ?? true;
  let activeId: string | null = null;
  let activeWebviewView: WebviewView | undefined;
  let lastComposerState: ComposerState | null = null;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let ignoreNextFileChange = false;

  function syncFiles(lintErrors?: string[]): void {
    if (root.length === 0) {
      return;
    }
    ignoreNextFileChange = true;
    syncWorkflowToFiles({
      activeId,
      enabled: workflowEnabled,
      lintErrors,
      step: resolveStep(activeId, stepByTabId),
      workspaceRoot: root,
    });
  }

  function persistState(): void {
    void context.globalState.update(STATE_KEY_STEPS, stepByTabId);
    void context.globalState.update(STATE_KEY_ENABLED, workflowEnabled);
  }

  function sendWorkflowConfig(view: WebviewView): void {
    void view.webview.postMessage({ enabled: workflowEnabled, stepByTabId, type: "workflowConfig" });
  }

  function sendComposerState(view: WebviewView, state: ComposerState): void {
    void view.webview.postMessage({ activeId: state.activeId, tabs: state.tabs, type: "composerState" });
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
    if (composerStateChanged(lastComposerState, state)) {
      lastComposerState = state;
      const prevActiveId = activeId;
      activeId = state.activeId;
      sendComposerState(activeWebviewView, state);
      if (activeId !== prevActiveId) {
        syncFiles();
      }
    }
  }

  function startPolling(): void {
    if (pollTimer != null) {
      return;
    }
    void poll();
    pollTimer = setInterval(() => void poll(), POLL_MS);
  }

  function stopPolling(): void {
    if (pollTimer != null) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  }

  function handleWebviewMessage(message: Record<string, unknown>): void {
    const type = message["type"];
    if (type === "openEditorVisual") {
      void openVexTreeEditorForActiveFile();
      return;
    }
    if (type === "requestState") {
      void poll();
      if (activeWebviewView != null) {
        sendWorkflowConfig(activeWebviewView);
      }
      return;
    }
    if (type === "refreshWindow") {
      void vscode.commands.executeCommand("workbench.action.reloadWindow");
      return;
    }
    if (type === "stepChanged") {
      const id = message["activeId"];
      const step = message["step"];
      if (typeof id === "string" && typeof step === "number") {
        stepByTabId = { ...stepByTabId, [id]: step };
        persistState();
        syncFiles();
      }
      return;
    }
    if (type === "toggleChanged") {
      const enabled = message["enabled"];
      if (typeof enabled === "boolean") {
        workflowEnabled = enabled;
        persistState();
        syncFiles();
      }
    }
  }

  async function handleExternalStepChange(fileState: { enabled: boolean; step: number }): Promise<void> {
    if (activeId == null) {
      return;
    }
    const prevStep = resolveStep(activeId, stepByTabId);
    if (fileState.step === prevStep) {
      return;
    }
    const isSpecToApprove = prevStep === 1 && fileState.step === 2;
    if (isSpecToApprove) {
      const lint = await lintAllVexFiles();
      if (!lint.ok) {
        stepByTabId = { ...stepByTabId, [activeId]: 1 };
        persistState();
        syncFiles(lint.errors);
        if (activeWebviewView != null) {
          sendWorkflowConfig(activeWebviewView);
        }
        void vscode.window.showWarningMessage(
          `Vex lint: ${String(lint.errors.length)} error(s) found. Agent returned to Spec step.`,
        );
        return;
      }
    }
    stepByTabId = { ...stepByTabId, [activeId]: fileState.step };
    persistState();
    syncFiles();
    if (activeWebviewView != null) {
      sendWorkflowConfig(activeWebviewView);
    }
  }

  if (root.length > 0) {
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, ".vex-workflow"));
    watcher.onDidChange(() => {
      if (ignoreNextFileChange) {
        ignoreNextFileChange = false;
        return;
      }
      const fileState = readWorkflowState(root);
      if (!fileState.enabled) {
        return;
      }
      void handleExternalStepChange(fileState);
    });
    context.subscriptions.push(watcher);
  }

  syncFiles();

  const provider = {
    resolveWebviewView(webviewView: WebviewView): void {
      activeWebviewView = webviewView;
      webviewView.webview.options = { enableScripts: true };
      webviewView.webview.html = buildStepperHtml();
      webviewView.webview.onDidReceiveMessage((msg: unknown) => {
        if (typeof msg === "object" && msg !== null) {
          handleWebviewMessage(msg as Record<string, unknown>);
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
  context.subscriptions.push({
    dispose: () => {
      if (root.length > 0) {
        cleanupWorkflowFiles(root);
      }
    },
  });
}

export function deactivate(): void {}

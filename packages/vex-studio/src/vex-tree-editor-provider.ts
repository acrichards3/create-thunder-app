import type {
  CancellationToken,
  CustomDocumentOpenContext,
  CustomReadonlyEditorProvider,
  ExtensionContext,
  WebviewPanel,
} from "vscode";
import * as vscode from "vscode";
import { getEditorVisualHtml } from "./get-editor-html";
import { parseVexDocument } from "./vex-parse";
import { applyVexLabelReplace, isVexApplyLabelEdit } from "./vex-edit-label";
import { VexTreeCustomDocument } from "./vex-tree-custom-document";
import { loadVexFileText } from "./vex-tree-load-text";

const DEBOUNCE_MS = 150;

type ResolveVexTreeInput = {
  context: ExtensionContext;
  document: VexTreeCustomDocument;
  token: CancellationToken;
  webviewPanel: WebviewPanel;
};

function resolveVexTreeEditor(input: ResolveVexTreeInput): void {
  const { context, document, token, webviewPanel } = input;
  if (token.isCancellationRequested) {
    return;
  }

  const extensionUri = context.extensionUri;
  const mediaRootUri = vscode.Uri.joinPath(extensionUri, "media");
  const scriptOnDisk = vscode.Uri.joinPath(mediaRootUri, "editor-visual.js");

  webviewPanel.webview.options = {
    enableScripts: true,
    localResourceRoots: [extensionUri, mediaRootUri],
  };

  const scriptUri = webviewPanel.webview.asWebviewUri(scriptOnDisk);

  webviewPanel.webview.html = getEditorVisualHtml(webviewPanel.webview, scriptUri);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const pushState = async (): Promise<void> => {
    const text = await loadVexFileText(document.uri);
    const result = parseVexDocument(text);
    if (!result.ok) {
      webviewPanel.webview.postMessage({
        payload: { errors: result.errors, fileName: document.uri.fsPath, kind: "parseError" },
        type: "vexVisual",
      });
      return;
    }
    if (result.document == null) {
      return;
    }
    webviewPanel.webview.postMessage({
      payload: { document: result.document, fileName: document.uri.fsPath, kind: "document" },
      type: "vexVisual",
    });
  };

  const subReady = webviewPanel.webview.onDidReceiveMessage((message: unknown) => {
    if (isVexApplyLabelEdit(message)) {
      void applyVexLabelReplace(document.uri, message.start, message.end, message.text);
      return;
    }
    if (typeof message === "object" && message !== null && "type" in message && message.type === "vexVisualReady") {
      void pushState();
    }
  });

  const subDoc = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document.uri.toString() !== document.uri.toString()) {
      return;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      void pushState();
    }, DEBOUNCE_MS);
  });

  webviewPanel.onDidDispose(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    subReady.dispose();
    subDoc.dispose();
  });
}

export function createVexTreeEditorProvider(
  context: ExtensionContext,
): CustomReadonlyEditorProvider<VexTreeCustomDocument> {
  return {
    async openCustomDocument(
      uri: vscode.Uri,
      _openContext: CustomDocumentOpenContext,
      token: CancellationToken,
    ): Promise<VexTreeCustomDocument> {
      if (token.isCancellationRequested) {
        throw new vscode.CancellationError();
      }
      await loadVexFileText(uri);
      return new VexTreeCustomDocument(uri);
    },
    resolveCustomEditor(
      document: VexTreeCustomDocument,
      webviewPanel: WebviewPanel,
      token: CancellationToken,
    ): Thenable<void> {
      return new Promise<void>(function (resolve, reject) {
        setTimeout(function () {
          if (token.isCancellationRequested) {
            resolve();
            return;
          }
          try {
            resolveVexTreeEditor({ context, document, token, webviewPanel });
            resolve();
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        }, 0);
      });
    },
  };
}

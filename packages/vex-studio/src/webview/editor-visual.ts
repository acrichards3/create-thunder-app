import type { ParseError, VexDocument } from "../vex-parse/types";
import { clearInlineEditorFromContent, setupInlineLabelEditing } from "./inline-label-editor";
import { renderDescribeBlock } from "./tree-paint";
import { applySvgZoom, createViewportState, fitTreeToViewport, initViewportControls } from "./viewport-controls";

declare function acquireVsCodeApi(): {
  getState(): unknown;
  postMessage(message: unknown): void;
  setState(state: unknown): void;
};

type VexVisualPayload =
  | { document: VexDocument; fileName?: string; kind: "document" }
  | { errors: ParseError[]; fileName?: string; kind: "parseError" }
  | { kind: "idle"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVexVisualPayload(value: unknown): value is VexVisualPayload {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind === "idle") {
    return typeof value.message === "string";
  }
  if (value.kind === "parseError") {
    return Array.isArray(value.errors);
  }
  if (value.kind === "document") {
    return isRecord(value.document) && Array.isArray(value.document.describes);
  }
  return false;
}

function escapeHtml(text: string): string {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const vscode = acquireVsCodeApi();
const viewportEl = document.getElementById("vex-ed-viewport");
const contentEl = document.getElementById("vex-ed-content");

function restoreTabIndex(): number {
  const saved: unknown = vscode.getState();
  if (typeof saved !== "object" || saved === null) {
    return 0;
  }
  const idx = (saved as Record<string, unknown>)["selectedTabIndex"];
  if (typeof idx !== "number") {
    return 0;
  }
  return idx;
}

let selectedTabIndex = restoreTabIndex();
let lastDescribeCount = 0;
let lastDocument: VexDocument | null = null;
let hasDoneInitialViewportReset = false;

function saveEditorState(): void {
  vscode.setState({ selectedTabIndex });
}

const vpState = viewportEl && contentEl ? createViewportState(viewportEl, contentEl) : null;

function resetView(): void {
  if (vpState) {
    fitTreeToViewport(vpState);
  }
}

function renderDocument(vexDoc: VexDocument, resetViewport: boolean): void {
  if (!contentEl) {
    return;
  }
  clearInlineEditorFromContent(contentEl);

  if (vexDoc.describes.length === 0) {
    contentEl.innerHTML = "";
    const p = document.createElement("p");
    p.className = "vex-ed-placeholder";
    p.textContent = "No top-level describe blocks.";
    contentEl.appendChild(p);
    if (resetViewport) {
      requestAnimationFrame(resetView);
    }
    return;
  }

  if (lastDescribeCount > 0 && vexDoc.describes.length !== lastDescribeCount) {
    selectedTabIndex = 0;
    saveEditorState();
  }
  lastDescribeCount = vexDoc.describes.length;
  if (selectedTabIndex >= vexDoc.describes.length) {
    selectedTabIndex = 0;
  }

  const tabsEl = document.getElementById("vex-ed-tabs");
  if (tabsEl) {
    tabsEl.innerHTML = "";
    vexDoc.describes.forEach((d, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `vex-ed-tab${index === selectedTabIndex ? " vex-ed-tab--active" : ""}`;
      btn.textContent = d.label;
      btn.addEventListener("click", function onTabClick() {
        selectedTabIndex = index;
        saveEditorState();
        if (lastDocument !== null) {
          renderDocument(lastDocument, true);
        }
      });
      tabsEl.appendChild(btn);
    });
  }

  contentEl.innerHTML = "";
  const tree = renderDescribeBlock(vexDoc.describes[selectedTabIndex]);
  contentEl.appendChild(tree);

  if (resetViewport) {
    requestAnimationFrame(resetView);
  } else if (vpState) {
    requestAnimationFrame(function () {
      applySvgZoom(vpState);
    });
  }
}

function renderPayload(payload: VexVisualPayload): void {
  const titleEl = document.getElementById("vex-ed-title");
  const idleEl = document.getElementById("vex-ed-idle");
  const errEl = document.getElementById("vex-ed-error");
  const mainEl = document.getElementById("vex-ed-main");
  const tabsEl = document.getElementById("vex-ed-tabs");

  if (!titleEl) {
    return;
  }
  if (!idleEl) {
    return;
  }
  if (!errEl) {
    return;
  }
  if (!mainEl) {
    return;
  }

  idleEl.hidden = true;
  errEl.hidden = true;
  mainEl.hidden = true;

  if (payload.kind === "idle") {
    lastDocument = null;
    if (tabsEl) {
      tabsEl.innerHTML = "";
    }
    idleEl.hidden = false;
    idleEl.textContent = payload.message;
    titleEl.textContent = "Vex";
    return;
  }

  if (payload.kind === "parseError") {
    lastDocument = null;
    if (tabsEl) {
      tabsEl.innerHTML = "";
    }
    errEl.hidden = false;
    titleEl.textContent = "Vex";
    const items = payload.errors.map((e) => `<li>Line ${String(e.line)}: ${escapeHtml(e.message)}</li>`);
    errEl.innerHTML = `<p><strong>Parse error</strong></p><ul>${items.join("")}</ul>`;
    return;
  }

  lastDocument = payload.document;
  mainEl.hidden = false;
  const base = payload.fileName ? payload.fileName.split(/[/\\]/u).pop() : "Vex";
  titleEl.textContent = `${base ?? "Vex"} — visual`;
  const resetViewport = !hasDoneInitialViewportReset;
  hasDoneInitialViewportReset = true;
  renderDocument(payload.document, resetViewport);
}

window.addEventListener("message", function (event: MessageEvent) {
  if (event.origin !== window.location.origin) {
    return;
  }
  const data: unknown = event.data;
  if (!isRecord(data)) {
    return;
  }
  if (data.type !== "vexVisual") {
    return;
  }
  if (!isVexVisualPayload(data.payload)) {
    return;
  }
  renderPayload(data.payload);
});

if (vpState) {
  initViewportControls(vpState);
}
setupInlineLabelEditing(contentEl, vscode);
vscode.postMessage({ type: "vexVisualReady" });

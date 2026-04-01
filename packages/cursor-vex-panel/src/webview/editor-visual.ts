import type { ParseError, VexDocument } from "../vex-parse/types";
import { renderDescribeBlock } from "./tree-paint";

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
};

type VexVisualPayload =
  | { fileName?: string; kind: "document"; document: VexDocument }
  | { errors: ParseError[]; fileName?: string; kind: "parseError" }
  | { kind: "idle"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVexVisualPayload(value: unknown): value is VexVisualPayload {
  if (!isRecord(value)) {
    return false;
  }
  const kind = value.kind;
  if (kind === "idle") {
    return typeof value.message === "string";
  }
  if (kind === "parseError") {
    return Array.isArray(value.errors);
  }
  if (kind === "document") {
    return isRecord(value.document) && Array.isArray(value.document.describes);
  }
  return false;
}

const vscode = acquireVsCodeApi();

let selectedTabIndex = 0;
let lastDescribeCount = 0;
let lastDocument: null | VexDocument = null;

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.18;
const FIT_VIEW_MARGIN = 0.92;
const WHEEL_FRAME_FACTOR_MAX = 1.38;
const WHEEL_FRAME_FACTOR_MIN = 0.72;
const WHEEL_ZOOM_EXP_K = 0.0048;

let zoom = 1;
let wheelAnchorVx = 0;
let wheelAnchorVy = 0;
let wheelDeltaAccum = 0;
let wheelZoomFlushScheduled = false;
let panDragging = false;
let dragPointerId: null | number = null;
let dragLastX = 0;
let dragLastY = 0;

let hasDoneInitialViewportReset = false;

const viewportEl = document.getElementById("vex-ed-viewport");
const contentEl = document.getElementById("vex-ed-content");

function escapeHtml(text: string): string {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applySvgZoom(): void {
  if (!contentEl) {
    return;
  }
  const svg = contentEl.querySelector("#tree-wrap svg");
  if (!svg) {
    return;
  }
  const bw = svg.getAttribute("data-svg-base-w");
  const bh = svg.getAttribute("data-svg-base-h");
  if (bw == null || bh == null) {
    return;
  }
  const w = Number(bw) * zoom;
  const h = Number(bh) * zoom;
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
}

function updateZoomLabel(): void {
  const el = document.getElementById("vex-ed-zoom-pct");
  if (!el) {
    return;
  }
  el.textContent = `${String(Math.round(zoom * 100))}%`;
}

function clampZoom(value: number): number {
  if (value < ZOOM_MIN) {
    return ZOOM_MIN;
  }
  if (value > ZOOM_MAX) {
    return ZOOM_MAX;
  }
  return value;
}

function centerViewportScroll(): void {
  if (!viewportEl) {
    return;
  }
  const maxLeft = Math.max(0, viewportEl.scrollWidth - viewportEl.clientWidth);
  const maxTop = Math.max(0, viewportEl.scrollHeight - viewportEl.clientHeight);
  viewportEl.scrollLeft = maxLeft / 2;
  viewportEl.scrollTop = maxTop / 2;
}

function scheduleViewportCenter(): void {
  if (!viewportEl) {
    return;
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      centerViewportScroll();
    });
  });
}

function fitTreeToViewport(): void {
  if (!viewportEl || !contentEl) {
    return;
  }
  const svg = contentEl.querySelector("#tree-wrap svg");
  if (!svg) {
    scheduleViewportCenter();
    return;
  }
  const bw = svg.getAttribute("data-svg-base-w");
  const bh = svg.getAttribute("data-svg-base-h");
  if (bw == null || bh == null) {
    return;
  }
  const baseW = Number(bw);
  const baseH = Number(bh);
  const vw = viewportEl.clientWidth;
  const vh = viewportEl.clientHeight;
  if (vw < 1 || vh < 1) {
    requestAnimationFrame(function () {
      fitTreeToViewport();
    });
    return;
  }
  const fit = Math.min((vw * FIT_VIEW_MARGIN) / baseW, (vh * FIT_VIEW_MARGIN) / baseH);
  const zoomNext = clampZoom(Math.min(1, fit));
  zoom = zoomNext;
  applySvgZoom();
  updateZoomLabel();
  scheduleViewportCenter();
}

function resetView(): void {
  fitTreeToViewport();
}

type SvgZoomScrollInput = {
  anchor: { vx: number; vy: number };
  ox: number;
  oy: number;
  r: number;
  slBefore: number;
  stBefore: number;
  svgLeftInViewport: number;
  svgTopInViewport: number;
};

function scheduleScrollAfterZoomTowardSvgPoint(input: SvgZoomScrollInput): void {
  const { anchor, ox, oy, r, slBefore, stBefore, svgLeftInViewport, svgTopInViewport } = input;
  requestAnimationFrame(function () {
    if (!viewportEl) {
      return;
    }
    const v = viewportEl;
    const nl = slBefore + svgLeftInViewport + ox * r - anchor.vx;
    const nt = stBefore + svgTopInViewport + oy * r - anchor.vy;
    const maxLeft = Math.max(0, v.scrollWidth - v.clientWidth);
    const maxTop = Math.max(0, v.scrollHeight - v.clientHeight);
    v.scrollLeft = Math.min(maxLeft, Math.max(0, nl));
    v.scrollTop = Math.min(maxTop, Math.max(0, nt));
  });
}

function flushWheelZoom(): void {
  wheelZoomFlushScheduled = false;
  if (wheelDeltaAccum === 0) {
    return;
  }
  const deltaSum = wheelDeltaAccum;
  wheelDeltaAccum = 0;
  const raw = Math.exp(-deltaSum * WHEEL_ZOOM_EXP_K);
  const factor = Math.min(WHEEL_FRAME_FACTOR_MAX, Math.max(WHEEL_FRAME_FACTOR_MIN, raw));
  zoomByFactor(factor, { vx: wheelAnchorVx, vy: wheelAnchorVy });
}

function scheduleWheelZoomFlush(): void {
  if (wheelZoomFlushScheduled) {
    return;
  }
  wheelZoomFlushScheduled = true;
  requestAnimationFrame(flushWheelZoom);
}

function zoomByFactor(factor: number, anchorViewport: { vx: number; vy: number } | undefined): void {
  if (!viewportEl) {
    return;
  }
  const vp = viewportEl;
  const oldZoom = zoom;
  const next = clampZoom(zoom * factor);
  if (next === oldZoom) {
    return;
  }
  const r = next / oldZoom;
  const slBefore = vp.scrollLeft;
  const stBefore = vp.scrollTop;
  const vpRect = vp.getBoundingClientRect();
  const svg = contentEl?.querySelector("#tree-wrap svg");
  let scrollInput: SvgZoomScrollInput | undefined;
  if (anchorViewport && svg) {
    const svgRect = svg.getBoundingClientRect();
    const svgLeftInViewport = svgRect.left - vpRect.left;
    const svgTopInViewport = svgRect.top - vpRect.top;
    scrollInput = {
      anchor: anchorViewport,
      ox: anchorViewport.vx - svgLeftInViewport,
      oy: anchorViewport.vy - svgTopInViewport,
      r,
      slBefore,
      stBefore,
      svgLeftInViewport,
      svgTopInViewport,
    };
  }
  zoom = next;
  applySvgZoom();
  updateZoomLabel();
  if (scrollInput) {
    scheduleScrollAfterZoomTowardSvgPoint(scrollInput);
  }
}

function setupPan(): void {
  if (!viewportEl) {
    return;
  }
  const vp = viewportEl;

  vp.addEventListener(
    "wheel",
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      wheelAnchorVx = e.clientX - rect.left;
      wheelAnchorVy = e.clientY - rect.top;
      wheelDeltaAccum += e.deltaY;
      scheduleWheelZoomFlush();
    },
    { passive: false },
  );

  function onPointerMove(e: PointerEvent): void {
    if (!panDragging || dragPointerId !== e.pointerId) {
      return;
    }
    const dx = e.clientX - dragLastX;
    const dy = e.clientY - dragLastY;
    dragLastX = e.clientX;
    dragLastY = e.clientY;
    vp.scrollLeft -= dx;
    vp.scrollTop -= dy;
  }

  function endPan(e: PointerEvent): void {
    if (!panDragging || dragPointerId !== e.pointerId) {
      return;
    }
    panDragging = false;
    dragPointerId = null;
    vp.classList.remove("vex-ed-viewport--dragging");
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", endPan);
    document.removeEventListener("pointercancel", endPan);
  }

  vp.addEventListener("pointerdown", function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) {
      return;
    }
    const t = e.target;
    if (!(t instanceof Node) || !vp.contains(t)) {
      return;
    }
    e.preventDefault();
    panDragging = true;
    dragPointerId = e.pointerId;
    dragLastX = e.clientX;
    dragLastY = e.clientY;
    vp.classList.add("vex-ed-viewport--dragging");
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endPan);
    document.addEventListener("pointercancel", endPan);
  });
}

function setupZoomControls(): void {
  const zoomIn = document.getElementById("vex-ed-zoom-in");
  const zoomOut = document.getElementById("vex-ed-zoom-out");
  const zoomReset = document.getElementById("vex-ed-zoom-reset");
  if (zoomIn) {
    zoomIn.addEventListener("click", function onZoomIn() {
      if (!viewportEl) {
        return;
      }
      zoomByFactor(ZOOM_STEP, {
        vx: viewportEl.clientWidth / 2,
        vy: viewportEl.clientHeight / 2,
      });
    });
  }
  if (zoomOut) {
    zoomOut.addEventListener("click", function onZoomOut() {
      if (!viewportEl) {
        return;
      }
      zoomByFactor(1 / ZOOM_STEP, {
        vx: viewportEl.clientWidth / 2,
        vy: viewportEl.clientHeight / 2,
      });
    });
  }
  if (zoomReset) {
    zoomReset.addEventListener("click", function onZoomReset() {
      resetView();
    });
  }
  updateZoomLabel();
}

function renderDocument(vexDoc: VexDocument, viewportOptions: { resetViewport?: boolean } | undefined): void {
  if (!contentEl) {
    return;
  }
  const resetViewport = viewportOptions?.resetViewport === true;
  const describes = vexDoc.describes;
  if (describes.length === 0) {
    contentEl.innerHTML = "";
    const p = document.createElement("p");
    p.className = "vex-ed-placeholder";
    p.textContent = "No top-level describe blocks.";
    contentEl.appendChild(p);
    if (resetViewport) {
      requestAnimationFrame(function () {
        resetView();
      });
    }
    return;
  }

  if (describes.length !== lastDescribeCount) {
    selectedTabIndex = 0;
  }
  lastDescribeCount = describes.length;
  if (selectedTabIndex >= describes.length) {
    selectedTabIndex = 0;
  }

  const tabsEl = document.getElementById("vex-ed-tabs");
  if (tabsEl) {
    tabsEl.innerHTML = "";
    describes.forEach((d, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `vex-ed-tab${index === selectedTabIndex ? " vex-ed-tab--active" : ""}`;
      btn.textContent = d.label;
      btn.addEventListener("click", function onTabClick() {
        selectedTabIndex = index;
        if (lastDocument !== null) {
          renderDocument(lastDocument, { resetViewport: true });
        }
      });
      tabsEl.appendChild(btn);
    });
  }

  contentEl.innerHTML = "";
  const block = describes[selectedTabIndex];
  const tree = renderDescribeBlock(block);
  contentEl.appendChild(tree);
  if (resetViewport) {
    requestAnimationFrame(function () {
      resetView();
    });
  } else {
    requestAnimationFrame(function () {
      applySvgZoom();
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
    const parts = payload.errors.map((e) => `Line ${String(e.line)}: ${escapeHtml(e.message)}`);
    const listItems = parts.map((p) => "<li>" + p + "</li>").join("");
    errEl.innerHTML = "<p><strong>Parse error</strong></p><ul>" + listItems + "</ul>";
    return;
  }

  lastDocument = payload.document;
  mainEl.hidden = false;
  const base = payload.fileName ? payload.fileName.split(/[/\\]/u).pop() : "Vex";
  titleEl.textContent = `${base ?? "Vex"} — visual`;
  const resetViewport = !hasDoneInitialViewportReset;
  hasDoneInitialViewportReset = true;
  renderDocument(payload.document, { resetViewport });
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

setupPan();
setupZoomControls();
vscode.postMessage({ type: "vexVisualReady" });

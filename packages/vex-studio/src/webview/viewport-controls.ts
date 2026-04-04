import { isInlineEditorTarget } from "./inline-label-editor";

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.18;
const FIT_VIEW_MARGIN = 0.92;
const WHEEL_FRAME_FACTOR_MAX = 1.38;
const WHEEL_FRAME_FACTOR_MIN = 0.72;
const WHEEL_ZOOM_EXP_K = 0.0048;

type ViewportState = {
  contentEl: HTMLElement;
  dragLastX: number;
  dragLastY: number;
  dragPointerId: null | number;
  panDragging: boolean;
  viewportEl: HTMLElement;
  wheelAnchorVx: number;
  wheelAnchorVy: number;
  wheelDeltaAccum: number;
  wheelZoomFlushScheduled: boolean;
  zoom: number;
};

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

export function applySvgZoom(state: ViewportState): void {
  const svg = state.contentEl.querySelector("#tree-wrap svg");
  if (!svg) {
    return;
  }
  const bw = svg.getAttribute("data-svg-base-w");
  const bh = svg.getAttribute("data-svg-base-h");
  if (bw == null || bh == null) {
    return;
  }
  svg.setAttribute("width", String(Number(bw) * state.zoom));
  svg.setAttribute("height", String(Number(bh) * state.zoom));
}

export function updateZoomLabel(state: ViewportState): void {
  const el = document.getElementById("vex-ed-zoom-pct");
  if (!el) {
    return;
  }
  el.textContent = `${String(Math.round(state.zoom * 100))}%`;
}

function centerViewportScroll(vp: HTMLElement): void {
  const maxLeft = Math.max(0, vp.scrollWidth - vp.clientWidth);
  const maxTop = Math.max(0, vp.scrollHeight - vp.clientHeight);
  vp.scrollLeft = maxLeft / 2;
  vp.scrollTop = maxTop / 2;
}

function scheduleViewportCenter(vp: HTMLElement): void {
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      centerViewportScroll(vp);
    });
  });
}

export function fitTreeToViewport(state: ViewportState): void {
  const vp = state.viewportEl;
  const svg = state.contentEl.querySelector("#tree-wrap svg");
  if (!svg) {
    scheduleViewportCenter(vp);
    return;
  }
  const bw = svg.getAttribute("data-svg-base-w");
  const bh = svg.getAttribute("data-svg-base-h");
  if (bw == null || bh == null) {
    return;
  }
  const baseW = Number(bw);
  const baseH = Number(bh);
  const vw = vp.clientWidth;
  const vh = vp.clientHeight;
  if (vw < 1 || vh < 1) {
    requestAnimationFrame(function () {
      fitTreeToViewport(state);
    });
    return;
  }
  const fit = Math.min((vw * FIT_VIEW_MARGIN) / baseW, (vh * FIT_VIEW_MARGIN) / baseH);
  state.zoom = clampZoom(Math.min(1, fit));
  applySvgZoom(state);
  updateZoomLabel(state);
  scheduleViewportCenter(vp);
}

type ZoomScrollInput = {
  anchor: { vx: number; vy: number };
  ox: number;
  oy: number;
  r: number;
  slBefore: number;
  stBefore: number;
  svgLeftInViewport: number;
  svgTopInViewport: number;
};

function scheduleScrollAfterZoom(vp: HTMLElement, input: ZoomScrollInput): void {
  requestAnimationFrame(function () {
    const nl = input.slBefore + input.svgLeftInViewport + input.ox * input.r - input.anchor.vx;
    const nt = input.stBefore + input.svgTopInViewport + input.oy * input.r - input.anchor.vy;
    const maxLeft = Math.max(0, vp.scrollWidth - vp.clientWidth);
    const maxTop = Math.max(0, vp.scrollHeight - vp.clientHeight);
    vp.scrollLeft = Math.min(maxLeft, Math.max(0, nl));
    vp.scrollTop = Math.min(maxTop, Math.max(0, nt));
  });
}

function zoomByFactor(state: ViewportState, factor: number, anchor: { vx: number; vy: number } | undefined): void {
  const vp = state.viewportEl;
  const oldZoom = state.zoom;
  const next = clampZoom(state.zoom * factor);
  if (next === oldZoom) {
    return;
  }
  const r = next / oldZoom;
  const slBefore = vp.scrollLeft;
  const stBefore = vp.scrollTop;
  const vpRect = vp.getBoundingClientRect();
  const svg = state.contentEl.querySelector("#tree-wrap svg");

  let scrollInput: ZoomScrollInput | undefined;
  if (anchor && svg) {
    const svgRect = svg.getBoundingClientRect();
    scrollInput = {
      anchor,
      ox: anchor.vx - (svgRect.left - vpRect.left),
      oy: anchor.vy - (svgRect.top - vpRect.top),
      r,
      slBefore,
      stBefore,
      svgLeftInViewport: svgRect.left - vpRect.left,
      svgTopInViewport: svgRect.top - vpRect.top,
    };
  }

  state.zoom = next;
  applySvgZoom(state);
  updateZoomLabel(state);

  if (scrollInput) {
    scheduleScrollAfterZoom(vp, scrollInput);
  }
}

function flushWheelZoom(state: ViewportState): void {
  state.wheelZoomFlushScheduled = false;
  if (state.wheelDeltaAccum === 0) {
    return;
  }
  const delta = state.wheelDeltaAccum;
  state.wheelDeltaAccum = 0;
  const raw = Math.exp(-delta * WHEEL_ZOOM_EXP_K);
  const factor = Math.min(WHEEL_FRAME_FACTOR_MAX, Math.max(WHEEL_FRAME_FACTOR_MIN, raw));
  zoomByFactor(state, factor, { vx: state.wheelAnchorVx, vy: state.wheelAnchorVy });
}

function setupWheelZoom(state: ViewportState): void {
  const vp = state.viewportEl;
  vp.addEventListener(
    "wheel",
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      state.wheelAnchorVx = e.clientX - rect.left;
      state.wheelAnchorVy = e.clientY - rect.top;
      state.wheelDeltaAccum += e.deltaY;
      if (!state.wheelZoomFlushScheduled) {
        state.wheelZoomFlushScheduled = true;
        requestAnimationFrame(function () {
          flushWheelZoom(state);
        });
      }
    },
    { passive: false },
  );
}

function setupPanDrag(state: ViewportState): void {
  const vp = state.viewportEl;

  function onPointerMove(e: PointerEvent): void {
    if (!state.panDragging || state.dragPointerId !== e.pointerId) {
      return;
    }
    vp.scrollLeft -= e.clientX - state.dragLastX;
    vp.scrollTop -= e.clientY - state.dragLastY;
    state.dragLastX = e.clientX;
    state.dragLastY = e.clientY;
  }

  function endPan(e: PointerEvent): void {
    if (!state.panDragging || state.dragPointerId !== e.pointerId) {
      return;
    }
    state.panDragging = false;
    state.dragPointerId = null;
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
    if (isInlineEditorTarget(t)) {
      return;
    }
    if (!(t instanceof Node) || !vp.contains(t)) {
      return;
    }
    if (t instanceof SVGElement && t.closest("rect.vex-node-card") != null) {
      return;
    }
    e.preventDefault();
    state.panDragging = true;
    state.dragPointerId = e.pointerId;
    state.dragLastX = e.clientX;
    state.dragLastY = e.clientY;
    vp.classList.add("vex-ed-viewport--dragging");
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endPan);
    document.addEventListener("pointercancel", endPan);
  });
}

function setupZoomButtons(state: ViewportState): void {
  const center = (): { vx: number; vy: number } => ({
    vx: state.viewportEl.clientWidth / 2,
    vy: state.viewportEl.clientHeight / 2,
  });

  document.getElementById("vex-ed-zoom-in")?.addEventListener("click", function onZoomIn() {
    zoomByFactor(state, ZOOM_STEP, center());
  });

  document.getElementById("vex-ed-zoom-out")?.addEventListener("click", function onZoomOut() {
    zoomByFactor(state, 1 / ZOOM_STEP, center());
  });

  document.getElementById("vex-ed-zoom-reset")?.addEventListener("click", function onZoomReset() {
    fitTreeToViewport(state);
  });

  updateZoomLabel(state);
}

export function createViewportState(viewportEl: HTMLElement, contentEl: HTMLElement): ViewportState {
  return {
    contentEl,
    dragLastX: 0,
    dragLastY: 0,
    dragPointerId: null,
    panDragging: false,
    viewportEl,
    wheelAnchorVx: 0,
    wheelAnchorVy: 0,
    wheelDeltaAccum: 0,
    wheelZoomFlushScheduled: false,
    zoom: 1,
  };
}

export function initViewportControls(state: ViewportState): void {
  setupWheelZoom(state);
  setupPanDrag(state);
  setupZoomButtons(state);
}

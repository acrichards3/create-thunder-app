import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { initAssistantPanel } from "./chat-panel.js";

const NS = "http://www.w3.org/2000/svg";
const NODE_H = 74;
const NODE_MIN_W = 128;
const NODE_MAX_W = 260;
const NODE_LEVEL_GAP_X = 16;
const TREE_LEAF_SPACING_X = 58;
const TREE_DEPTH_PER_LEVEL = 112;
const TREE_LAYOUT_MIN_DEPTH_PX = 168;
const TREE_LAYOUT_MIN_BREADTH = 340;

const DASHBOARD_VIEW_STORAGE_KEY = "vexkit.dashboard.view.v1";
const EXPLORER_WIDTH_MIN = 200;
const EXPLORER_WIDTH_MAX = 640;

const state = {
  assistantCollapsed: false,
  assistantWidthPx: null,
  currentPath: null,
  explorerCollapsed: false,
  explorerWidthPx: null,
  expandedDirs: new Set(),
  parseResult: null,
  selectedFnIndex: 0,
  tree: [],
  vexSource: "",
  workflow: { approvalsByPath: {}, currentVexPath: "", phase: "spec" },
  workflowSelectedStep: 0,
};

function clampExplorerWidthPx(w) {
  return Math.min(EXPLORER_WIDTH_MAX, Math.max(EXPLORER_WIDTH_MIN, Math.round(w)));
}

function setExplorerWidthCss(px) {
  document.documentElement.style.setProperty("--explorer-width", `${String(px)}px`);
}

function applyExplorerWidthFromState() {
  if (typeof state.explorerWidthPx !== "number" || !Number.isFinite(state.explorerWidthPx)) {
    return;
  }
  const w = clampExplorerWidthPx(state.explorerWidthPx);
  state.explorerWidthPx = w;
  setExplorerWidthCss(w);
}

function loadDashboardView() {
  try {
    const raw = localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY);
    if (raw == null) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed.explorerCollapsed === "boolean") {
      state.explorerCollapsed = parsed.explorerCollapsed;
    }
    if (Array.isArray(parsed.expandedDirs)) {
      state.expandedDirs = new Set(parsed.expandedDirs.filter((p) => typeof p === "string" && p.length > 0));
    }
    if (typeof parsed.currentPath === "string" && parsed.currentPath.length > 0) {
      state.currentPath = parsed.currentPath;
    }
    if (typeof parsed.selectedFnIndex === "number" && Number.isFinite(parsed.selectedFnIndex)) {
      state.selectedFnIndex = Math.max(0, Math.floor(parsed.selectedFnIndex));
    }
    if (typeof parsed.explorerWidthPx === "number" && Number.isFinite(parsed.explorerWidthPx)) {
      state.explorerWidthPx = clampExplorerWidthPx(parsed.explorerWidthPx);
    }
    if (typeof parsed.assistantCollapsed === "boolean") {
      state.assistantCollapsed = parsed.assistantCollapsed;
    }
    if (typeof parsed.assistantWidthPx === "number" && Number.isFinite(parsed.assistantWidthPx)) {
      state.assistantWidthPx = Math.min(560, Math.max(260, Math.round(parsed.assistantWidthPx)));
    }
    if (typeof parsed.workflowSelectedStep === "number" && Number.isFinite(parsed.workflowSelectedStep)) {
      state.workflowSelectedStep = Math.max(0, Math.min(5, Math.floor(parsed.workflowSelectedStep)));
    }
  } catch {
    /* ignore corrupt or unavailable storage */
  }
}

function setWorkflowStatus(text, isErr) {
  const el = document.getElementById("workflow-status");
  el.hidden = text.length === 0;
  el.textContent = text;
  el.classList.toggle("err", Boolean(isErr));
}

async function fetchWorkflow() {
  const res = await fetch("/api/workflow");
  if (!res.ok) {
    setWorkflowStatus("Could not load workflow state.", true);
    return;
  }
  state.workflow = await res.json();
  setWorkflowStatus("");
  renderWorkflowBar();
}

async function postWorkflow(body) {
  const prevPhase = state.workflow.phase;
  const res = await fetch("/api/workflow", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    setWorkflowStatus(typeof data.message === "string" ? data.message : "Workflow update failed.", true);
    return false;
  }
  state.workflow = data;
  if (data.phase !== prevPhase) {
    state.workflowSelectedStep = computeWorkflowProgressFromState();
    saveDashboardView();
  }
  setWorkflowStatus("");
  renderWorkflowBar();
  return true;
}

function computeWorkflowProgressIdx(input) {
  const { allApproved, pathOk, phase } = input;
  if (!pathOk) {
    return 0;
  }
  if (phase === "spec" && !allApproved) {
    return 1;
  }
  if (phase === "spec" && allApproved) {
    return 2;
  }
  if (phase === "build") {
    return 3;
  }
  if (phase === "done") {
    return 5;
  }
  return 1;
}

function computeWorkflowProgressFromState() {
  const pathOk = state.currentPath != null && state.currentPath.length > 0;
  const doc = state.parseResult != null && state.parseResult.ok ? state.parseResult.document : null;
  const fnNames = doc != null && Array.isArray(doc.functions) ? doc.functions.map((f) => f.name) : [];
  const approved = new Set(state.workflow.approvalsByPath[state.currentPath ?? ""] ?? []);
  const allApproved = fnNames.length > 0 && fnNames.every((n) => approved.has(n));
  return computeWorkflowProgressIdx({
    allApproved,
    pathOk,
    phase: state.workflow.phase,
  });
}

function applyWorkflowPanelVisibility() {
  const sel = state.workflowSelectedStep;
  for (let i = 0; i < 6; i += 1) {
    const p = document.getElementById(`workflow-tabpanel-${String(i)}`);
    if (p == null) {
      continue;
    }
    p.hidden = i !== sel;
  }
}

function workflowAddButton(parent, label, onClick, disabled) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "workflow-btn";
  btn.textContent = label;
  btn.disabled = Boolean(disabled);
  btn.addEventListener("click", onClick);
  parent.append(btn);
}

function renderWorkflowStepper(progressIdx) {
  const nav = document.getElementById("workflow-stepper");
  nav.replaceChildren();
  const line = document.createElement("div");
  line.className = "stepper-line";
  line.setAttribute("aria-hidden", "true");
  line.setAttribute("role", "presentation");
  const labels = ["Describe", "Spec", "Approve", "Build", "Verify", "Done"];
  const gapCount = labels.length - 1;
  const splitRatio = Math.min(1, Math.max(0, progressIdx / gapCount));
  line.style.setProperty("--stepper-line-split-pct", `${String(splitRatio * 100)}%`);
  nav.append(line);
  const phase = state.workflow.phase;
  const selected = state.workflowSelectedStep;
  labels.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stepper-node";
    btn.id = `workflow-tab-${String(i)}`;
    btn.setAttribute("aria-controls", `workflow-tabpanel-${String(i)}`);
    btn.setAttribute("aria-selected", selected === i ? "true" : "false");
    btn.setAttribute("role", "tab");
    if (phase === "done") {
      btn.classList.add("stepper-node--done-all");
    } else if (i < progressIdx) {
      btn.classList.add("stepper-node--past");
    } else if (i === progressIdx) {
      btn.classList.add("stepper-node--current");
    } else {
      btn.classList.add("stepper-node--future");
    }
    if (selected === i) {
      btn.classList.add("stepper-node--selected");
    }
    const inner = document.createElement("span");
    inner.className = "stepper-node__label";
    inner.textContent = label;
    btn.append(inner);
    const stepIndex = i;
    btn.addEventListener("click", () => {
      state.workflowSelectedStep = stepIndex;
      saveDashboardView();
      renderWorkflowBar();
    });
    nav.append(btn);
  });
}

function renderWorkflowActions(fnNames, allApproved) {
  const continueEl = document.getElementById("workflow-actions-continue");
  const buildEl = document.getElementById("workflow-actions-build");
  const verifyEl = document.getElementById("workflow-actions-verify");
  const doneEl = document.getElementById("workflow-actions-done");
  continueEl.replaceChildren();
  buildEl.replaceChildren();
  verifyEl.replaceChildren();
  doneEl.replaceChildren();
  const phase = state.workflow.phase;
  const pathOk = state.currentPath != null && state.currentPath.length > 0;

  workflowAddButton(
    continueEl,
    "Continue to build",
    () => {
      void postWorkflow({ phase: "build" });
    },
    phase !== "spec" || !pathOk || !allApproved || fnNames.length === 0,
  );

  workflowAddButton(
    buildEl,
    "Back to spec",
    () => {
      void postWorkflow({ phase: "spec" });
    },
    phase === "spec",
  );

  workflowAddButton(
    buildEl,
    "Generate spec",
    () => {
      if (state.currentPath == null) {
        return;
      }
      void (async () => {
        const res = await fetch("/api/codegen-spec", {
          body: JSON.stringify({ overwrite: false, path: state.currentPath }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          const again = await fetch("/api/codegen-spec", {
            body: JSON.stringify({ overwrite: true, path: state.currentPath }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
          const d2 = await again.json().catch(() => ({}));
          if (!again.ok) {
            setWorkflowStatus(typeof d2.message === "string" ? d2.message : "Codegen failed.", true);
            return;
          }
          setWorkflowStatus(`Wrote ${typeof d2.wrote === "string" ? d2.wrote : "spec"}.`);
          return;
        }
        if (!res.ok) {
          setWorkflowStatus(typeof data.message === "string" ? data.message : "Codegen failed.", true);
          return;
        }
        setWorkflowStatus(`Wrote ${typeof data.wrote === "string" ? data.wrote : "spec"}.`);
      })();
    },
    !pathOk,
  );

  workflowAddButton(
    verifyEl,
    "Verify pair",
    () => {
      if (state.currentPath == null) {
        return;
      }
      void (async () => {
        const q = new URLSearchParams({ path: state.currentPath });
        const res = await fetch(`/api/verify-pair?${q.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setWorkflowStatus("Verify: structure matches paired .spec.ts.");
        } else {
          setWorkflowStatus(typeof data.message === "string" ? data.message : "Verify failed.", true);
        }
      })();
    },
    !pathOk,
  );

  workflowAddButton(
    verifyEl,
    "Run paired tests",
    () => {
      if (state.currentPath == null) {
        return;
      }
      void (async () => {
        const res = await fetch("/api/run-spec-tests", {
          body: JSON.stringify({ path: state.currentPath }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof data.message === "string"
              ? data.message
              : `${typeof data.stdout === "string" ? data.stdout : ""}${typeof data.stderr === "string" ? data.stderr : ""}`;
          setWorkflowStatus(msg.trim().length > 0 ? msg : "Tests failed.", true);
          return;
        }
        setWorkflowStatus("Tests passed.");
      })();
    },
    !pathOk,
  );

  workflowAddButton(
    doneEl,
    "Mark done",
    () => {
      void postWorkflow({ phase: "done" });
    },
    phase !== "build",
  );
}

function renderWorkflowApprovals(fnNames) {
  const wrap = document.getElementById("workflow-approvals");
  const outer = document.getElementById("workflow-approvals-wrap");
  wrap.replaceChildren();
  if (fnNames.length === 0 || state.workflow.phase !== "spec") {
    outer.hidden = true;
    return;
  }
  outer.hidden = false;
  const approved = new Set(state.workflow.approvalsByPath[state.currentPath ?? ""] ?? []);
  fnNames.forEach((name) => {
    const row = document.createElement("div");
    row.className = "workflow-fn-approve";
    const lab = document.createElement("span");
    lab.className = "workflow-fn-name";
    lab.textContent = name;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "workflow-btn";
    const isAp = approved.has(name);
    btn.textContent = isAp ? "Unapprove" : "Approve";
    btn.addEventListener("click", () => {
      void postWorkflow(isAp ? { unapproveFunction: name } : { approveFunction: name });
    });
    row.append(lab, btn);
    wrap.append(row);
  });
}

function renderWorkflowBar() {
  const pathOk = state.currentPath != null && state.currentPath.length > 0;
  const doc = state.parseResult != null && state.parseResult.ok ? state.parseResult.document : null;
  const fnNames = doc != null && Array.isArray(doc.functions) ? doc.functions.map((f) => f.name) : [];
  const approved = new Set(state.workflow.approvalsByPath[state.currentPath ?? ""] ?? []);
  const allApproved = fnNames.length > 0 && fnNames.every((n) => approved.has(n));
  const phase = state.workflow.phase;
  const progressIdx = computeWorkflowProgressIdx({ allApproved, pathOk, phase });

  renderWorkflowStepper(progressIdx);
  renderWorkflowActions(fnNames, allApproved);
  renderWorkflowApprovals(fnNames);

  const editorWrap = document.getElementById("workflow-editor-wrap");
  const ta = document.getElementById("vex-source-editor");
  const saveBtn = document.getElementById("vex-save-btn");
  if (!pathOk || doc == null) {
    editorWrap.hidden = true;
    applyWorkflowPanelVisibility();
    return;
  }
  editorWrap.hidden = false;
  ta.value = state.vexSource;
  const allowEdit = phase === "spec";
  ta.disabled = !allowEdit;
  saveBtn.disabled = !allowEdit;
  applyWorkflowPanelVisibility();
}

function saveDashboardView() {
  try {
    const payload = {
      assistantCollapsed: state.assistantCollapsed,
      assistantWidthPx: typeof state.assistantWidthPx === "number" ? state.assistantWidthPx : null,
      currentPath: state.currentPath,
      explorerCollapsed: state.explorerCollapsed,
      expandedDirs: [...state.expandedDirs],
      explorerWidthPx: typeof state.explorerWidthPx === "number" ? state.explorerWidthPx : null,
      selectedFnIndex: state.selectedFnIndex,
      workflowSelectedStep: state.workflowSelectedStep,
    };
    localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

let graphInteractionAbort = null;
let watchReloadTimer = null;
const graphView = {
  applyTransform: () => {},
  scale: 1,
  tx: 0,
  ty: 0,
};

function kindLabel(kind) {
  if (kind === "fn") {
    return "Function";
  }
  if (kind === "when") {
    return "When";
  }
  if (kind === "and") {
    return "And";
  }
  return "It";
}

function branchToTree(body) {
  if (body.kind === "it") {
    return { children: [], kind: "it", label: body.label, line: body.line };
  }
  const kids = body.child ? [branchToTree(body.child)] : [];
  return { children: kids, kind: "and", label: body.label, line: body.line };
}

function whenToTree(when) {
  return {
    children: when.branches.map((b) => branchToTree(b)),
    kind: "when",
    label: when.label,
    line: when.line,
  };
}

function treeDataFromFunction(fn) {
  const whens = Array.isArray(fn.whens) ? fn.whens : [];
  return {
    children: whens.map((w) => whenToTree(w)),
    kind: "fn",
    label: fn.name,
    line: fn.line,
  };
}

function measureNodeWidth(d) {
  const raw = d.data.label;
  const ell = raw.length > 44 ? `${raw.slice(0, 42)}…` : raw;
  d.displayLabel = ell;
  const w = Math.round(Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, ell.length * 6.6 + 52)));
  d.nodeWidth = w;
  return w;
}

function resolveNodeOverlapX(hierarchyRoot) {
  const maxDepth = hierarchyRoot.height;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let depth = 0; depth <= maxDepth; depth += 1) {
      const row = [];
      hierarchyRoot.each((d) => {
        if (d.depth === depth) {
          row.push(d);
        }
      });
      if (row.length <= 1) {
        continue;
      }
      const ordered = row.toSorted((a, b) => a.px - b.px);
      for (let i = 1; i < ordered.length; i += 1) {
        const prev = ordered[i - 1];
        const cur = ordered[i];
        const minCenter = prev.px + prev.nodeWidth / 2 + NODE_LEVEL_GAP_X + cur.nodeWidth / 2;
        if (cur.px < minCenter) {
          const delta = minCenter - cur.px;
          cur.eachBefore((n) => {
            n.px += delta;
          });
        }
      }
    }
  }
}

function layoutHierarchy(treeData) {
  const root = d3.hierarchy(treeData);
  const leaves = root.leaves();
  const leafCount = Math.max(1, leaves.length);
  const maxDepth = root.height + 1;
  const breadth = Math.max(
    TREE_LAYOUT_MIN_BREADTH,
    leafCount * TREE_LEAF_SPACING_X,
    NODE_MAX_W * leafCount + NODE_LEVEL_GAP_X * (leafCount + 1),
  );
  const depthPx = Math.max(TREE_LAYOUT_MIN_DEPTH_PX, maxDepth * TREE_DEPTH_PER_LEVEL);
  d3.tree().size([breadth, depthPx])(root);
  root.each((d) => {
    d.px = d.x + 18;
    d.py = d.y + 18;
  });
  return root;
}

function curvedLinkPath(sx, sy, tx, ty) {
  const gen = d3
    .linkVertical()
    .x((p) => p[0])
    .y((p) => p[1]);
  return gen({
    source: [sx, sy],
    target: [tx, ty],
  });
}

function graphBounds(hierarchyRoot) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  hierarchyRoot.each((d) => {
    const w = d.nodeWidth;
    minX = Math.min(minX, d.px - w / 2 - 12);
    maxX = Math.max(maxX, d.px + w / 2 + 12);
    minY = Math.min(minY, d.py - NODE_H / 2 - 12);
    maxY = Math.max(maxY, d.py + NODE_H / 2 + 12);
  });
  return { maxX, maxY, minX, minY };
}

function setGraphTransform(panRoot, input) {
  const { scale, tx, ty } = input;
  graphView.scale = scale;
  graphView.tx = tx;
  graphView.ty = ty;
  panRoot.setAttribute("transform", `translate(${String(tx)},${String(ty)}) scale(${String(scale)})`);
}

function fitGraphInViewport(viewport, panRoot, bounds) {
  const w = Math.max(bounds.maxX - bounds.minX, 1);
  const h = Math.max(bounds.maxY - bounds.minY, 1);
  const vw = Math.max(viewport.clientWidth, 64);
  const vh = Math.max(viewport.clientHeight, 64);
  const pad = 56;
  const scaleRaw = Math.min((vw - pad) / w, (vh - pad) / h, 1.12, 1);
  const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 ? Math.max(scaleRaw, 0.04) : 0.5;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const tx = vw / 2 - scale * cx;
  const ty = vh / 2 - scale * cy;
  setGraphTransform(panRoot, { scale, tx, ty });
}

function viewportHasSize(viewport) {
  return viewport.clientWidth > 8 && viewport.clientHeight > 8;
}

function scheduleFitAndWire(viewport, panRoot, bounds) {
  const run = () => {
    void viewport.offsetHeight;
    void viewport.getBoundingClientRect();
    if (!viewportHasSize(viewport)) {
      return false;
    }
    fitGraphInViewport(viewport, panRoot, bounds);
    wireGraphPanZoom(viewport, panRoot);
    return true;
  };

  if (run()) {
    return;
  }

  requestAnimationFrame(() => {
    if (run()) {
      return;
    }
    requestAnimationFrame(() => {
      if (run()) {
        return;
      }
      const ro = new ResizeObserver(() => {
        if (run()) {
          ro.disconnect();
        }
      });
      ro.observe(viewport);
    });
  });
}

function wireGraphPanZoom(viewport, panRoot) {
  if (graphInteractionAbort) {
    graphInteractionAbort.abort();
  }
  graphInteractionAbort = new AbortController();
  const signal = graphInteractionAbort.signal;

  graphView.applyTransform = () => {
    setGraphTransform(panRoot, {
      scale: graphView.scale,
      tx: graphView.tx,
      ty: graphView.ty,
    });
  };

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let dy = e.deltaY;
      if (e.deltaMode === 1) {
        dy *= 16;
      }
      if (e.deltaMode === 2) {
        dy *= Math.max(rect.height, 64);
      }
      const zoom = Math.exp(-dy * 0.00078);
      if (!Number.isFinite(zoom) || zoom <= 0) {
        return;
      }
      const newScale = Math.min(2.4, Math.max(0.18, graphView.scale * zoom));
      const ratio = newScale / graphView.scale;
      graphView.tx = mx - ratio * (mx - graphView.tx);
      graphView.ty = my - ratio * (my - graphView.ty);
      graphView.scale = newScale;
      graphView.applyTransform();
    },
    { passive: false, signal },
  );

  viewport.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0) {
        return;
      }
      const t = e.target;
      if (t.closest && t.closest(".logic-node-hit")) {
        return;
      }
      viewport.classList.add("logic-canvas-grabbing");
      viewport.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      const startTx = graphView.tx;
      const startTy = graphView.ty;
      const onMove = (ev) => {
        graphView.tx = startTx + ev.clientX - startX;
        graphView.ty = startTy + ev.clientY - startY;
        graphView.applyTransform();
      };
      const onUp = (ev) => {
        viewport.classList.remove("logic-canvas-grabbing");
        try {
          viewport.releasePointerCapture(ev.pointerId);
        } catch {
          /* pointer may not be captured */
        }
        viewport.removeEventListener("pointermove", onMove);
        viewport.removeEventListener("pointerup", onUp);
        viewport.removeEventListener("pointercancel", onUp);
      };
      viewport.addEventListener("pointermove", onMove, { signal });
      viewport.addEventListener("pointerup", onUp, { signal });
      viewport.addEventListener("pointercancel", onUp, { signal });
    },
    { signal },
  );
}

function drawLinks(linksLayer, hierarchyRoot) {
  for (const link of hierarchyRoot.links()) {
    const s = link.source;
    const t = link.target;
    const sw = s.nodeWidth;
    const tw = t.nodeWidth;
    const sx = s.px;
    const sy = s.py + NODE_H / 2;
    const tx = t.px;
    const ty = t.py - NODE_H / 2;
    const dPath = curvedLinkPath(sx, sy, tx, ty);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", dPath);
    p.setAttribute("fill", "none");
    p.setAttribute("marker-end", "url(#logic-arrow)");
    p.setAttribute("stroke", "#8b9cb3");
    p.setAttribute("stroke-width", "1.5");
    linksLayer.append(p);
  }
}

const NODE_THEME = {
  and: { fill: "rgba(122,184,122,0.22)", kind: "#9ed49e", stroke: "#7ab87a" },
  fn: { fill: "rgba(91,159,212,0.22)", kind: "#8ec4f0", stroke: "#5b9fd4" },
  it: { fill: "rgba(184,143,212,0.22)", kind: "#c9a8e0", stroke: "#b88fd4" },
  when: { fill: "rgba(196,163,90,0.24)", kind: "#dcc07a", stroke: "#c4a35a" },
};

function drawNodes(nodesLayer, hierarchyRoot) {
  hierarchyRoot.each((d) => {
    const w = d.nodeWidth;
    const theme = NODE_THEME[d.data.kind] ?? NODE_THEME.fn;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${String(d.px)},${String(d.py)})`);

    const hit = document.createElementNS(NS, "rect");
    hit.setAttribute("class", "logic-node-hit");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("height", String(NODE_H + 8));
    hit.setAttribute("width", String(w + 8));
    hit.setAttribute("x", String(-(w + 8) / 2));
    hit.setAttribute("y", String(-(NODE_H + 8) / 2));

    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("class", "logic-node-rect");
    rect.setAttribute("fill", theme.fill);
    rect.setAttribute("height", String(NODE_H));
    rect.setAttribute("rx", "8");
    rect.setAttribute("stroke", theme.stroke);
    rect.setAttribute("stroke-width", "1.75");
    rect.setAttribute("width", String(w));
    rect.setAttribute("x", String(-w / 2));
    rect.setAttribute("y", String(-NODE_H / 2));

    const kindEl = document.createElementNS(NS, "text");
    kindEl.setAttribute("fill", theme.kind);
    kindEl.setAttribute("font-size", "9px");
    kindEl.setAttribute("font-weight", "700");
    kindEl.setAttribute("text-anchor", "middle");
    kindEl.setAttribute("x", "0");
    kindEl.setAttribute("y", String(-NODE_H / 2 + 17));
    kindEl.textContent = kindLabel(d.data.kind);

    const lab = document.createElementNS(NS, "text");
    lab.setAttribute("fill", "#e7ecf3");
    lab.setAttribute("font-size", "12px");
    lab.setAttribute("text-anchor", "middle");
    lab.setAttribute("x", "0");
    lab.setAttribute("y", "4");
    lab.textContent = d.displayLabel;

    const tip = document.createElementNS(NS, "title");
    tip.textContent = `${d.data.label} (line ${String(d.data.line)})`;

    const lineEl = document.createElementNS(NS, "text");
    lineEl.setAttribute("fill", "#8b9cb3");
    lineEl.setAttribute("font-size", "10px");
    lineEl.setAttribute("text-anchor", "middle");
    lineEl.setAttribute("x", "0");
    lineEl.setAttribute("y", String(NODE_H / 2 - 10));
    lineEl.textContent = `Line ${String(d.data.line)}`;

    g.append(hit, rect, kindEl, lab, lineEl, tip);
    nodesLayer.append(g);
  });
}

function renderLogicGraph(fn) {
  const svg = document.getElementById("logic-canvas-svg");
  const viewport = document.getElementById("logic-canvas-viewport");
  svg.replaceChildren();
  const defs = document.createElementNS(NS, "defs");
  const marker = document.createElementNS(NS, "marker");
  marker.setAttribute("id", "logic-arrow");
  marker.setAttribute("markerHeight", "9");
  marker.setAttribute("markerWidth", "9");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("refX", "8");
  marker.setAttribute("refY", "4.5");
  const arrowPath = document.createElementNS(NS, "path");
  arrowPath.setAttribute("d", "M0,0 L9,4.5 L0,9 L2,4.5 Z");
  arrowPath.setAttribute("fill", "#8b9cb3");
  marker.append(arrowPath);
  defs.append(marker);
  const panRoot = document.createElementNS(NS, "g");
  panRoot.setAttribute("id", "logic-pan-root");
  const linksLayer = document.createElementNS(NS, "g");
  const nodesLayer = document.createElementNS(NS, "g");
  panRoot.append(linksLayer, nodesLayer);
  svg.append(defs, panRoot);

  const data = treeDataFromFunction(fn);
  const hierarchyRoot = layoutHierarchy(data);
  hierarchyRoot.each((d) => {
    measureNodeWidth(d);
  });
  resolveNodeOverlapX(hierarchyRoot);

  drawLinks(linksLayer, hierarchyRoot);
  drawNodes(nodesLayer, hierarchyRoot);

  const bounds = graphBounds(hierarchyRoot);
  scheduleFitAndWire(viewport, panRoot, bounds);
}

function renderFileNode(node) {
  const li = document.createElement("li");

  if (node.kind === "directory") {
    const row = document.createElement("div");
    row.className = "file-row";
    const twisty = document.createElement("span");
    twisty.className = "twisty";
    const isOpen = state.expandedDirs.has(node.relativePath);
    twisty.textContent = isOpen ? "▼" : "▶";
    twisty.addEventListener("click", () => {
      if (state.expandedDirs.has(node.relativePath)) {
        state.expandedDirs.delete(node.relativePath);
      } else {
        state.expandedDirs.add(node.relativePath);
      }
      renderFileTree();
      saveDashboardView();
    });
    const label = document.createElement("span");
    label.textContent = `${node.name}/`;
    row.append(twisty, label);
    li.append(row);
    if (isOpen && node.children) {
      const ul = document.createElement("ul");
      ul.className = "file-list";
      for (const ch of node.children) {
        ul.append(renderFileNode(ch));
      }
      li.append(ul);
    }
    return li;
  }

  const row = document.createElement("div");
  const isVex = node.name.endsWith(".vex");
  row.className = isVex ? "file-row file-vex" : "file-row file-other";
  if (isVex && node.relativePath === state.currentPath) {
    row.classList.add("file-row-current");
    row.setAttribute("aria-current", "true");
  }
  row.textContent = node.name;
  if (isVex) {
    row.addEventListener("click", () => {
      void openVexFile(node.relativePath);
    });
  }
  li.append(row);
  return li;
}

function renderFileTree() {
  const el = document.getElementById("sidebar-tree");
  el.replaceChildren();
  const ul = document.createElement("ul");
  ul.className = "file-list root";
  for (const node of state.tree) {
    ul.append(renderFileNode(node));
  }
  el.append(ul);
}

function collapseAllExplorerFolders() {
  state.expandedDirs.clear();
  renderFileTree();
  saveDashboardView();
}

async function refreshTree() {
  const res = await fetch("/api/tree");
  if (!res.ok) {
    document.getElementById("header-root").textContent = "Failed to load file tree.";
    return;
  }
  const data = await res.json();
  state.tree = data.tree;
  document.getElementById("header-root").textContent = data.root;
  renderFileTree();
}

function updateMainPanel() {
  try {
    const hint = document.getElementById("hint");
    const errBox = document.getElementById("parse-errors");
    const logicTree = document.getElementById("logic-tree");
    const toolbar = document.getElementById("toolbar");
    hint.hidden = true;
    errBox.hidden = true;
    logicTree.hidden = true;
    toolbar.replaceChildren();

    if (state.parseResult == null) {
      hint.hidden = false;
      return;
    }

    if (!state.parseResult.ok) {
      errBox.hidden = false;
      const lines = state.parseResult.errors.map((e) => `Line ${String(e.line)}: ${e.message}`);
      errBox.textContent = lines.join("\n");
      return;
    }

    const doc = state.parseResult.document;
    if (doc == null || doc.functions.length === 0) {
      errBox.hidden = false;
      errBox.textContent = "No functions in document.";
      return;
    }

    const fnCount = doc.functions.length;
    if (state.selectedFnIndex >= fnCount) {
      state.selectedFnIndex = fnCount - 1;
    }

    for (let i = 0; i < doc.functions.length; i += 1) {
      const fn = doc.functions[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = i === state.selectedFnIndex ? "fn-btn active" : "fn-btn";
      btn.textContent = fn.name;
      const idx = i;
      btn.addEventListener("click", () => {
        state.selectedFnIndex = idx;
        updateMainPanel();
      });
      toolbar.append(btn);
    }

    logicTree.hidden = false;
    const viewportEl = document.getElementById("logic-canvas-viewport");
    const canvasHint = document.querySelector(".logic-canvas-hint");
    void logicTree.offsetHeight;
    void viewportEl.offsetHeight;
    const fn = doc.functions[state.selectedFnIndex];
    if (canvasHint != null) {
      const hasWhens = Array.isArray(fn.whens) && fn.whens.length > 0;
      canvasHint.textContent = hasWhens
        ? "Scroll to zoom · drag empty space to pan"
        : "No WHEN blocks under this function.";
    }
    renderLogicGraph(fn);
  } finally {
    renderWorkflowBar();
    saveDashboardView();
  }
}

async function openVexFile(relPath, options) {
  const pathChanged = state.currentPath !== relPath;
  const resetFunctionIndex = options?.resetFunctionIndex !== false;
  state.currentPath = relPath;
  if (resetFunctionIndex) {
    state.selectedFnIndex = 0;
  }
  const params = new URLSearchParams({ path: relPath });
  const res = await fetch(`/api/document?${params.toString()}`);
  const data = await res.json();
  state.vexSource = typeof data.source === "string" ? data.source : "";
  state.parseResult = {
    document: data.document,
    errors: data.errors,
    ok: data.ok,
  };
  if (res.ok) {
    const synced = await postWorkflow({ currentVexPath: relPath });
    if (!synced) {
      await fetchWorkflow();
    }
  } else {
    await fetchWorkflow();
  }
  if (pathChanged) {
    state.workflowSelectedStep = computeWorkflowProgressFromState();
  }
  updateMainPanel();
  renderFileTree();
}

function onVexSaveClick() {
  void (async () => {
    if (state.currentPath == null) {
      return;
    }
    const ta = document.getElementById("vex-source-editor");
    const res = await fetch("/api/document", {
      body: JSON.stringify({ path: state.currentPath, source: ta.value }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setWorkflowStatus(typeof payload.message === "string" ? payload.message : "Save failed.", true);
      return;
    }
    setWorkflowStatus("Saved .vex");
    await openVexFile(state.currentPath, { resetFunctionIndex: false });
  })();
}

document.getElementById("collapse-all-folders").addEventListener("click", collapseAllExplorerFolders);

function syncExplorerPanel() {
  const layout = document.getElementById("layout");
  const btn = document.getElementById("toggle-explorer");
  const collapsed = state.explorerCollapsed;
  layout.classList.toggle("sidebar-explorer-collapsed", collapsed);
  btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  btn.textContent = collapsed ? "⟩" : "⟨";
  btn.setAttribute("title", collapsed ? "Show file explorer (Ctrl+B or ⌘B)" : "Hide file explorer (Ctrl+B or ⌘B)");
  btn.setAttribute("aria-label", collapsed ? "Show file explorer" : "Hide file explorer");
}

function toggleExplorerPanel() {
  state.explorerCollapsed = !state.explorerCollapsed;
  syncExplorerPanel();
  saveDashboardView();
}

function onExplorerHotkey(e) {
  if (!(e.ctrlKey || e.metaKey)) {
    return;
  }
  if (e.key !== "b" && e.key !== "B") {
    return;
  }
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
    return;
  }
  e.preventDefault();
  toggleExplorerPanel();
}

loadDashboardView();
applyExplorerWidthFromState();

document.getElementById("vex-save-btn").addEventListener("click", onVexSaveClick);

function wireSidebarResize() {
  const handle = document.getElementById("sidebar-resize-handle");
  const layout = document.getElementById("layout");
  const shell = document.getElementById("sidebar-shell");
  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  function shellWidthNow() {
    return shell.getBoundingClientRect().width;
  }

  function onPointerDown(e) {
    if (state.explorerCollapsed) {
      return;
    }
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = shellWidthNow();
    layout.classList.add("sidebar-shell-resizing");
    document.body.classList.add("sidebar-resize-active");
    handle.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) {
      return;
    }
    const delta = e.clientX - startX;
    const w = clampExplorerWidthPx(startWidth + delta);
    setExplorerWidthCss(w);
  }

  function onPointerUp(e) {
    if (!dragging) {
      return;
    }
    dragging = false;
    layout.classList.remove("sidebar-shell-resizing");
    document.body.classList.remove("sidebar-resize-active");
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may not be held */
    }
    state.explorerWidthPx = clampExplorerWidthPx(shellWidthNow());
    setExplorerWidthCss(state.explorerWidthPx);
    saveDashboardView();
  }

  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);
  handle.addEventListener("pointercancel", onPointerUp);
}

document.getElementById("toggle-explorer").addEventListener("click", toggleExplorerPanel);
window.addEventListener("keydown", onExplorerHotkey);
syncExplorerPanel();
wireSidebarResize();

await fetchWorkflow();
await refreshTree();

if (state.currentPath != null) {
  await openVexFile(state.currentPath, { resetFunctionIndex: false });
}

function scheduleReloadFromWatch() {
  if (watchReloadTimer != null) {
    clearTimeout(watchReloadTimer);
  }
  watchReloadTimer = window.setTimeout(async () => {
    watchReloadTimer = null;
    await refreshTree();
    if (state.currentPath != null) {
      await openVexFile(state.currentPath, { resetFunctionIndex: false });
    }
  }, 220);
}

function onWatchSocketMessage(ev) {
  let payload;
  try {
    payload = JSON.parse(ev.data);
  } catch {
    return;
  }
  if (payload?.type !== "vexFilesChanged") {
    return;
  }
  scheduleReloadFromWatch();
}

function connectProjectWatch() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${proto}//${location.host}/api/watch`);
  ws.addEventListener("message", onWatchSocketMessage);
  ws.addEventListener("close", () => {
    window.setTimeout(connectProjectWatch, 2600);
  });
  ws.addEventListener("error", () => {
    ws.close();
  });
}

connectProjectWatch();

initAssistantPanel({
  getChatExtraFields() {
    return {
      currentVexPath: state.workflow.currentVexPath,
      workflowPhase: state.workflow.phase,
    };
  },
  saveDashboardView,
  state,
});

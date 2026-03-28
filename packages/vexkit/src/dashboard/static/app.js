import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { initAssistantPanel } from "./chat-panel.js?v=20";

const NS = "http://www.w3.org/2000/svg";
const NODE_MAX_W = 248;
const NODE_KIND_BASELINE = 16;
const NODE_LABEL_FIRST_BASELINE = 38;
const NODE_LABEL_LINE_H = 14;
const NODE_LABEL_MAX_LINES = 14;
const NODE_LABEL_BOTTOM_PAD = 12;
const NODE_INNER_PAD_X = 12;
const NODE_LABEL_CHAR_W = 6.2;
const NODE_LEVEL_GAP_X = 16;
const TREE_LEAF_SPACING_X = 58;
const TREE_DEPTH_PER_LEVEL = 132;
const TREE_LAYOUT_MIN_DEPTH_PX = 168;
const TREE_LAYOUT_MIN_BREADTH = 340;

const DASHBOARD_VIEW_STORAGE_KEY = "vexkit.dashboard.view.v1";
const WORKFLOW_STEP_LABELS = ["Describe", "Spec", "Approve", "Build", "Verify", "Done"];

function wireWorkflowRevertModal() {
  const overlay = document.getElementById("workflow-revert-modal-overlay");
  const bodyEl = document.getElementById("workflow-revert-modal-body");
  const titleEl = document.getElementById("workflow-revert-modal-title");
  const cancelBtn = document.getElementById("workflow-revert-modal-cancel");
  const confirmBtn = document.getElementById("workflow-revert-modal-confirm");
  if (overlay == null || bodyEl == null || titleEl == null || cancelBtn == null || confirmBtn == null) {
    return () => {};
  }
  let pendingStep = null;
  function closeModal() {
    pendingStep = null;
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
  }
  function openModal(step) {
    pendingStep = step;
    const label = WORKFLOW_STEP_LABELS[step];
    titleEl.textContent = `Revert to ${label}?`;
    bodyEl.textContent = `You will move the workflow back to ${label}. Approvals, verify results, and phase progress after that point will be cleared or reset for this run.`;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    confirmBtn.focus();
  }
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  confirmBtn.addEventListener("click", () => {
    if (pendingStep == null) {
      return;
    }
    const step = pendingStep;
    closeModal();
    setWorkflowStep(step);
  });
  document.addEventListener("keydown", (e) => {
    if (overlay.hidden) {
      return;
    }
    if (e.key !== "Escape") {
      return;
    }
    e.preventDefault();
    closeModal();
  });
  return openModal;
}

const openWorkflowRevertModal = wireWorkflowRevertModal();
const EXPLORER_WIDTH_MIN = 200;
const EXPLORER_WIDTH_MAX = 640;

const state = {
  approvalsByPath: {},
  assistantChatModel: null,
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
  workflowStep: 0,
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
    if (typeof parsed.assistantChatModel === "string" && parsed.assistantChatModel.length > 0) {
      state.assistantChatModel = parsed.assistantChatModel;
    }
    if (typeof parsed.workflowStep === "number" && Number.isFinite(parsed.workflowStep)) {
      state.workflowStep = Math.max(0, Math.min(5, Math.floor(parsed.workflowStep)));
    }
    if (parsed.approvalsByPath != null && typeof parsed.approvalsByPath === "object") {
      state.approvalsByPath = parsed.approvalsByPath;
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

async function runCodegenSpecForCurrentPath() {
  const path = state.currentPath;
  if (path == null || path.length === 0) {
    setWorkflowStatus("Open a .vex file before continuing.", true);
    return false;
  }
  const res = await fetch("/api/codegen-spec", {
    body: JSON.stringify({ overwrite: false, path }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const again = await fetch("/api/codegen-spec", {
      body: JSON.stringify({ overwrite: true, path }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const d2 = await again.json().catch(() => ({}));
    if (!again.ok) {
      setWorkflowStatus(typeof d2.message === "string" ? d2.message : "Codegen failed.", true);
      return false;
    }
    setWorkflowStatus(`Wrote ${typeof d2.wrote === "string" ? d2.wrote : "spec"}.`);
    return true;
  }
  if (!res.ok) {
    setWorkflowStatus(typeof data.message === "string" ? data.message : "Codegen failed.", true);
    return false;
  }
  setWorkflowStatus(`Wrote ${typeof data.wrote === "string" ? data.wrote : "spec"}.`);
  return true;
}

function syncLogicCanvasSpecEditClass() {
  const viewport = document.getElementById("logic-canvas-viewport");
  const logicTree = document.getElementById("logic-tree");
  const canvasHint = document.querySelector(".logic-canvas-hint");
  if (viewport == null || logicTree == null || logicTree.hidden) {
    return;
  }
  const specOk = state.parseResult?.ok === true;
  const isSpecStep = state.workflowStep === 1 || state.workflowStep === 2;
  const canSpecEdit = isSpecStep && specOk;
  viewport.classList.toggle("logic-canvas--spec-edit", canSpecEdit);
  if (canvasHint != null && specOk) {
    const doc = state.parseResult?.document;
    const fn = doc?.functions?.[state.selectedFnIndex];
    if (fn != null) {
      const hasWhens = Array.isArray(fn.whens) && fn.whens.length > 0;
      if (hasWhens) {
        if (isSpecStep) {
          canvasHint.textContent = "Click a node to edit its label · scroll to zoom · drag empty space to pan";
        } else {
          canvasHint.textContent = "Scroll to zoom · drag empty space to pan";
        }
      }
    }
  }
}

function setWorkflowStep(step) {
  state.workflowStep = Math.max(0, Math.min(5, Math.floor(step)));
  saveDashboardView();
  renderWorkflowBar();
}

function getApprovedFnNames() {
  return new Set(state.approvalsByPath[state.currentPath ?? ""] ?? []);
}

function areAllFnsApproved() {
  const doc = state.parseResult != null && state.parseResult.ok ? state.parseResult.document : null;
  const fnNames = doc != null && Array.isArray(doc.functions) ? doc.functions.map((f) => f.name) : [];
  if (fnNames.length === 0) {
    return false;
  }
  const approved = getApprovedFnNames();
  return fnNames.every((n) => approved.has(n));
}

function applyWorkflowPanelVisibility() {
  const sel = state.workflowStep;
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

function renderWorkflowStepper() {
  const nav = document.getElementById("workflow-stepper");
  nav.replaceChildren();
  nav.setAttribute("aria-label", "Workflow steps — choose a completed step to go back");
  const line = document.createElement("div");
  line.className = "stepper-line";
  line.setAttribute("aria-hidden", "true");
  line.setAttribute("role", "presentation");
  const labels = ["Describe", "Spec", "Approve", "Build", "Verify", "Done"];
  const gapCount = labels.length - 1;
  const current = state.workflowStep;
  const splitRatio = Math.min(1, Math.max(0, current / gapCount));
  line.style.setProperty("--stepper-line-split-pct", `${String(splitRatio * 100)}%`);
  nav.append(line);
  labels.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stepper-node";
    btn.id = `workflow-tab-${String(i)}`;
    btn.setAttribute("aria-controls", `workflow-tabpanel-${String(i)}`);
    btn.setAttribute("aria-selected", current === i ? "true" : "false");
    btn.setAttribute("role", "tab");
    if (i > current) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("title", "Complete earlier steps first");
      btn.setAttribute("aria-label", `${label} (locked)`);
    } else if (i < current) {
      btn.setAttribute("title", `Go back to ${label}`);
      btn.setAttribute("aria-label", `Go back to ${label}`);
    } else {
      btn.setAttribute("title", `Current: ${label}`);
      btn.setAttribute("aria-label", `Current step: ${label}`);
    }
    if (current === 5) {
      btn.classList.add("stepper-node--done-all");
    } else if (i < current) {
      btn.classList.add("stepper-node--past");
    } else if (i === current) {
      btn.classList.add("stepper-node--current");
    } else {
      btn.classList.add("stepper-node--future");
    }
    if (current === i) {
      btn.classList.add("stepper-node--selected");
    }
    const inner = document.createElement("span");
    inner.className = "stepper-node__label";
    inner.textContent = label;
    inner.setAttribute("aria-hidden", "true");
    btn.append(inner);
    const stepIndex = i;
    btn.addEventListener("click", () => {
      if (stepIndex < current) {
        openWorkflowRevertModal(stepIndex);
      }
    });
    nav.append(btn);
  });
}

function renderWorkflowActions() {
  const continueEl = document.getElementById("workflow-actions-continue");
  const buildEl = document.getElementById("workflow-actions-build");
  const verifyEl = document.getElementById("workflow-actions-verify");
  const doneEl = document.getElementById("workflow-actions-done");
  continueEl.replaceChildren();
  buildEl.replaceChildren();
  verifyEl.replaceChildren();
  doneEl.replaceChildren();
  const step = state.workflowStep;

  workflowAddButton(
    continueEl,
    "Continue to Build",
    () => {
      void (async () => {
        setWorkflowStatus("Generating spec…");
        const ok = await runCodegenSpecForCurrentPath();
        if (!ok) {
          return;
        }
        setWorkflowStep(3);
        if (assistantControls != null) {
          setTimeout(() => assistantControls.autoPrompt(), 100);
        }
      })();
    },
    step !== 2 || !areAllFnsApproved(),
  );

  workflowAddButton(
    doneEl,
    "Start New",
    () => {
      state.approvalsByPath = {};
      setWorkflowStep(0);
    },
    step !== 5,
  );
}

function toggleApproval(fnName) {
  const key = state.currentPath ?? "";
  const current = state.approvalsByPath[key] ?? [];
  const set = new Set(current);
  if (set.has(fnName)) {
    set.delete(fnName);
  } else {
    set.add(fnName);
  }
  state.approvalsByPath[key] = [...set];
  saveDashboardView();
  renderWorkflowBar();
}

function approveAll(fnNames) {
  const key = state.currentPath ?? "";
  state.approvalsByPath[key] = [...fnNames];
  saveDashboardView();
  renderWorkflowBar();
}

function renderWorkflowApprovals(fnNames) {
  const wrap = document.getElementById("workflow-approvals");
  const outer = document.getElementById("workflow-approvals-wrap");
  wrap.replaceChildren();
  if (fnNames.length === 0 || state.workflowStep !== 2) {
    outer.hidden = true;
    return;
  }
  outer.hidden = false;
  const approved = getApprovedFnNames();
  const approveAllRow = document.createElement("div");
  approveAllRow.className = "workflow-fn-approve";
  const approveAllBtn = document.createElement("button");
  approveAllBtn.type = "button";
  approveAllBtn.className = "workflow-btn";
  approveAllBtn.textContent = "Approve all functions";
  approveAllBtn.addEventListener("click", () => {
    approveAll(fnNames);
  });
  approveAllRow.append(approveAllBtn);
  wrap.append(approveAllRow);
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
      toggleApproval(name);
    });
    row.append(lab, btn);
    wrap.append(row);
  });
}

function renderWorkflowBar() {
  const doc = state.parseResult != null && state.parseResult.ok ? state.parseResult.document : null;
  const fnNames = doc != null && Array.isArray(doc.functions) ? doc.functions.map((f) => f.name) : [];

  renderWorkflowStepper();
  renderWorkflowActions();
  renderWorkflowApprovals(fnNames);
  applyWorkflowPanelVisibility();
  syncLogicCanvasSpecEditClass();
  if (assistantControls != null && typeof assistantControls.syncWorkflowComposer === "function") {
    assistantControls.syncWorkflowComposer();
  }
}

function saveDashboardView() {
  try {
    const payload = {
      approvalsByPath: state.approvalsByPath,
      assistantChatModel: typeof state.assistantChatModel === "string" ? state.assistantChatModel : null,
      assistantCollapsed: state.assistantCollapsed,
      assistantWidthPx: typeof state.assistantWidthPx === "number" ? state.assistantWidthPx : null,
      currentPath: state.currentPath,
      explorerCollapsed: state.explorerCollapsed,
      expandedDirs: [...state.expandedDirs],
      explorerWidthPx: typeof state.explorerWidthPx === "number" ? state.explorerWidthPx : null,
      selectedFnIndex: state.selectedFnIndex,
      workflowStep: state.workflowStep,
    };
    localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

let graphInteractionAbort = null;
let watchReloadTimer = null;
let pendingVexEditPath = null;
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

function branchToTree(body, path) {
  if (body.kind === "it") {
    return { children: [], kind: "it", label: body.label, line: body.line, vexPath: path };
  }
  const kids = body.child ? [branchToTree(body.child, [...path, 0])] : [];
  return { children: kids, kind: "and", label: body.label, line: body.line, vexPath: path };
}

function whenToTree(when, fnIndex, whenIndex) {
  const basePath = [fnIndex, whenIndex];
  return {
    children: when.branches.map((b, bi) => branchToTree(b, [...basePath, bi])),
    kind: "when",
    label: when.label,
    line: when.line,
    vexPath: basePath,
  };
}

function treeDataFromFunction(fn, fnIndex) {
  const whens = Array.isArray(fn.whens) ? fn.whens : [];
  return {
    children: whens.map((w, wi) => whenToTree(w, fnIndex, wi)),
    kind: "fn",
    label: fn.name,
    line: fn.line,
    vexPath: [fnIndex],
  };
}

function cloneVexDocument(doc) {
  if (typeof structuredClone === "function") {
    return structuredClone(doc);
  }
  return JSON.parse(JSON.stringify(doc));
}

function updateBodyLabel(body, tail, newLabel) {
  if (tail.length === 0) {
    return { ...body, label: newLabel };
  }
  if (body.kind === "it") {
    return body;
  }
  const [t0, ...trest] = tail;
  if (t0 !== 0 || body.child == null) {
    return body;
  }
  return { ...body, child: updateBodyLabel(body.child, trest, newLabel) };
}

function updateBranchesAt(branches, path, newLabel) {
  const [b, ...tail] = path;
  return branches.map((body, idx) => {
    if (idx !== b) {
      return body;
    }
    return updateBodyLabel(body, tail, newLabel);
  });
}

function updateNodeLabel(doc, segments, newLabel) {
  if (segments.length === 1) {
    const fi = segments[0];
    return {
      ...doc,
      functions: doc.functions.map((f, i) => (i === fi ? { ...f, name: newLabel } : f)),
    };
  }
  if (segments.length === 2) {
    const [fi, wi] = segments;
    return {
      ...doc,
      functions: doc.functions.map((f, i) => {
        if (i !== fi) {
          return f;
        }
        return {
          ...f,
          whens: f.whens.map((w, j) => (j === wi ? { ...w, label: newLabel } : w)),
        };
      }),
    };
  }
  const [fi, wi, ...rest] = segments;
  return {
    ...doc,
    functions: doc.functions.map((f, i) => {
      if (i !== fi) {
        return f;
      }
      return {
        ...f,
        whens: f.whens.map((w, j) => {
          if (j !== wi) {
            return w;
          }
          return { ...w, branches: updateBranchesAt(w.branches, rest, newLabel) };
        }),
      };
    }),
  };
}

function closeVexNodeEditDialog() {
  const overlay = document.getElementById("vex-node-edit-overlay");
  if (overlay != null) {
    overlay.hidden = true;
  }
  pendingVexEditPath = null;
}

function openVexNodeEditDialog(data) {
  const overlay = document.getElementById("vex-node-edit-overlay");
  const input = document.getElementById("vex-node-edit-input");
  const titleEl = document.getElementById("vex-node-edit-title");
  if (overlay == null || input == null || titleEl == null) {
    return;
  }
  if (!Array.isArray(data.vexPath)) {
    return;
  }
  pendingVexEditPath = data.vexPath;
  input.value = data.label;
  titleEl.textContent = `Edit ${kindLabel(data.kind)}`;
  overlay.hidden = false;
  input.focus();
  input.select();
}

function onLogicNodeHitClick(data) {
  if (state.workflowStep !== 1 && state.workflowStep !== 2) {
    return;
  }
  if (state.currentPath == null || state.parseResult?.ok !== true) {
    return;
  }
  if (!Array.isArray(data.vexPath)) {
    return;
  }
  openVexNodeEditDialog(data);
}

async function commitVexNodeEdit() {
  const path = pendingVexEditPath;
  const input = document.getElementById("vex-node-edit-input");
  if (path == null || state.currentPath == null || input == null) {
    return;
  }
  const raw = input.value.trim();
  if (raw.length === 0) {
    setWorkflowStatus("Label cannot be empty.", true);
    return;
  }
  const doc = state.parseResult?.document;
  if (doc == null || state.parseResult?.ok !== true) {
    return;
  }
  const nextDoc = updateNodeLabel(cloneVexDocument(doc), path, raw);
  const res = await fetch("/api/document", {
    body: JSON.stringify({ document: nextDoc, path: state.currentPath }),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    setWorkflowStatus(typeof payload.message === "string" ? payload.message : "Save failed.", true);
    return;
  }
  setWorkflowStatus("Updated .vex");
  closeVexNodeEditDialog();
  await openVexFile(state.currentPath, { resetFunctionIndex: false });
}

function splitLongToken(token, maxLen) {
  if (token.length <= maxLen) {
    return [token];
  }
  const parts = [];
  for (let i = 0; i < token.length; i += maxLen) {
    parts.push(token.slice(i, i + maxLen));
  }
  return parts;
}

function wrapLabelToLines(text, maxWidthPx) {
  const maxChars = Math.max(4, Math.floor(maxWidthPx / NODE_LABEL_CHAR_W));
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const tokens = words.flatMap((w) => splitLongToken(w, maxChars));
  if (tokens.length === 0) {
    return [""];
  }
  const lines = [];
  let line = tokens[0];
  for (let i = 1; i < tokens.length; i += 1) {
    const t = tokens[i];
    const next = `${line} ${t}`;
    if (next.length <= maxChars) {
      line = next;
    } else {
      lines.push(line);
      line = t;
    }
  }
  lines.push(line);
  return lines;
}

function capLabelLines(lines) {
  if (lines.length <= NODE_LABEL_MAX_LINES) {
    return lines;
  }
  const out = lines.slice(0, NODE_LABEL_MAX_LINES);
  const last = out[NODE_LABEL_MAX_LINES - 1];
  out[NODE_LABEL_MAX_LINES - 1] = `${last}…`;
  return out;
}

function measureNode(d) {
  const raw = d.data.label;
  const innerW = NODE_MAX_W - NODE_INNER_PAD_X * 2;
  const lines = capLabelLines(wrapLabelToLines(raw, innerW));
  d.labelLines = lines;
  d.nodeWidth = NODE_MAX_W;
  const lineCount = Math.max(1, lines.length);
  d.nodeHeight = NODE_LABEL_FIRST_BASELINE + (lineCount - 1) * NODE_LABEL_LINE_H + NODE_LABEL_BOTTOM_PAD;
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
    const h = d.nodeHeight;
    minX = Math.min(minX, d.px - w / 2 - 12);
    maxX = Math.max(maxX, d.px + w / 2 + 12);
    minY = Math.min(minY, d.py - h / 2 - 12);
    maxY = Math.max(maxY, d.py + h / 2 + 12);
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
    const sx = s.px;
    const sy = s.py + s.nodeHeight / 2;
    const tx = t.px;
    const ty = t.py - t.nodeHeight / 2;
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
    const h = d.nodeHeight;
    const lines = d.labelLines;
    const theme = NODE_THEME[d.data.kind] ?? NODE_THEME.fn;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${String(d.px)},${String(d.py)})`);

    const hit = document.createElementNS(NS, "rect");
    hit.setAttribute("class", "logic-node-hit");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("height", String(h + 8));
    hit.setAttribute("width", String(w + 8));
    hit.setAttribute("x", String(-(w + 8) / 2));
    hit.setAttribute("y", String(-(h + 8) / 2));

    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("class", "logic-node-rect");
    rect.setAttribute("fill", theme.fill);
    rect.setAttribute("height", String(h));
    rect.setAttribute("rx", "7");
    rect.setAttribute("stroke", theme.stroke);
    rect.setAttribute("stroke-width", "1.75");
    rect.setAttribute("width", String(w));
    rect.setAttribute("x", String(-w / 2));
    rect.setAttribute("y", String(-h / 2));

    const kindEl = document.createElementNS(NS, "text");
    kindEl.setAttribute("fill", theme.kind);
    kindEl.setAttribute("font-size", "8px");
    kindEl.setAttribute("font-weight", "700");
    kindEl.setAttribute("text-anchor", "middle");
    kindEl.setAttribute("x", "0");
    kindEl.setAttribute("y", String(-h / 2 + NODE_KIND_BASELINE));
    kindEl.textContent = kindLabel(d.data.kind);

    const lab = document.createElementNS(NS, "text");
    lab.setAttribute("fill", "#e7ecf3");
    lab.setAttribute("font-size", "11px");
    lab.setAttribute("text-anchor", "middle");
    lab.setAttribute("x", "0");
    lab.setAttribute("y", String(-h / 2 + NODE_LABEL_FIRST_BASELINE));
    lines.forEach((line, i) => {
      const ts = document.createElementNS(NS, "tspan");
      ts.setAttribute("x", "0");
      if (i > 0) {
        ts.setAttribute("dy", String(NODE_LABEL_LINE_H));
      }
      ts.textContent = line;
      lab.append(ts);
    });

    const tip = document.createElementNS(NS, "title");
    tip.textContent = d.data.label;

    hit.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onLogicNodeHitClick(d.data);
    });

    g.append(hit, rect, kindEl, lab, tip);
    nodesLayer.append(g);
  });
}

function renderLogicGraph(fn) {
  const svg = document.getElementById("logic-canvas-svg");
  const viewport = document.getElementById("logic-canvas-viewport");
  viewport.classList.toggle(
    "logic-canvas--spec-edit",
    (state.workflowStep === 1 || state.workflowStep === 2) && state.parseResult?.ok === true,
  );
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

  const data = treeDataFromFunction(fn, state.selectedFnIndex);
  const hierarchyRoot = layoutHierarchy(data);
  hierarchyRoot.each((d) => {
    measureNode(d);
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

async function treeHasRelativePath(nodes, relPath) {
  if (!Array.isArray(nodes)) {
    return false;
  }
  return nodes.some((node) => {
    if (node.relativePath === relPath) {
      return true;
    }
    return node.children != null && treeHasRelativePath(node.children, relPath);
  });
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
      const errs = state.parseResult.errors;
      if (Array.isArray(errs) && errs.length > 0) {
        errBox.textContent = errs.map((e) => `Line ${String(e.line)}: ${e.message}`).join("\n");
      } else if (typeof state.parseResult.loadErrorMessage === "string") {
        errBox.textContent = state.parseResult.loadErrorMessage;
      } else {
        errBox.textContent = "Document could not be loaded.";
      }
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
      if (hasWhens) {
        if (state.workflowStep === 1 || state.workflowStep === 2) {
          canvasHint.textContent =
            "Use the assistant to describe work across .vex files · scroll to zoom · drag empty space to pan";
        } else {
          canvasHint.textContent = "Scroll to zoom · drag empty space to pan";
        }
      } else {
        canvasHint.textContent = "No WHEN blocks under this function.";
      }
    }
    renderLogicGraph(fn);
  } finally {
    renderWorkflowBar();
    saveDashboardView();
  }
}

async function openVexFile(relPath, options) {
  const resetFunctionIndex = options?.resetFunctionIndex !== false;
  state.currentPath = relPath;
  if (resetFunctionIndex) {
    state.selectedFnIndex = 0;
  }
  const params = new URLSearchParams({ path: relPath });
  const res = await fetch(`/api/document?${params.toString()}`);
  const data = await res.json();
  if (res.ok) {
    state.vexSource = typeof data.source === "string" ? data.source : "";
    state.parseResult = {
      document: data.document,
      errors: Array.isArray(data.errors) ? data.errors : [],
      ok: data.ok === true,
    };
  } else {
    state.vexSource = "";
    const msg = typeof data.message === "string" ? data.message : "Could not load document.";
    state.parseResult = {
      document: null,
      errors: [],
      loadErrorMessage: msg,
      ok: false,
    };
  }
  saveDashboardView();
  updateMainPanel();
  renderFileTree();
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

const vexNodeEditForm = document.getElementById("vex-node-edit-form");
const vexNodeEditCancel = document.getElementById("vex-node-edit-cancel");
const vexNodeEditOverlay = document.getElementById("vex-node-edit-overlay");
if (vexNodeEditForm != null) {
  vexNodeEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    void commitVexNodeEdit();
  });
}
if (vexNodeEditCancel != null) {
  vexNodeEditCancel.addEventListener("click", () => {
    closeVexNodeEditDialog();
  });
}
if (vexNodeEditOverlay != null) {
  vexNodeEditOverlay.addEventListener("click", (e) => {
    if (e.target === vexNodeEditOverlay) {
      closeVexNodeEditDialog();
    }
  });
}
document.addEventListener("keydown", (e) => {
  if (vexNodeEditOverlay == null || vexNodeEditOverlay.hidden) {
    return;
  }
  if (e.key === "Escape") {
    closeVexNodeEditDialog();
  }
});

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

let assistantControls = null;

function handleStepChange(newStep) {
  setWorkflowStep(newStep);
  if (newStep === 4 && assistantControls != null) {
    assistantControls.triggerVerify();
  }
}

function handleSpecChangeRequest(reason) {
  const overlay = document.getElementById("workflow-revert-modal-overlay");
  const bodyEl = document.getElementById("workflow-revert-modal-body");
  const titleEl = document.getElementById("workflow-revert-modal-title");
  if (overlay == null || bodyEl == null || titleEl == null) {
    return;
  }
  titleEl.textContent = "Agent requests spec changes";
  bodyEl.textContent = reason;
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
  const confirmBtn = document.getElementById("workflow-revert-modal-confirm");
  const cancelBtn = document.getElementById("workflow-revert-modal-cancel");
  function cleanup() {
    confirmBtn.removeEventListener("click", onConfirm);
    cancelBtn.removeEventListener("click", onCancel);
  }
  function onConfirm() {
    cleanup();
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    setWorkflowStep(1);
    if (assistantControls != null) {
      setTimeout(() => assistantControls.autoPrompt("Refine the specs based on the build feedback."), 100);
    }
  }
  function onCancel() {
    cleanup();
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
  }
  confirmBtn.addEventListener("click", onConfirm);
  cancelBtn.addEventListener("click", onCancel);
}

assistantControls = initAssistantPanel({
  onSpecChangeRequest: handleSpecChangeRequest,
  onStartNew: () => {
    state.approvalsByPath = {};
    setWorkflowStep(0);
  },
  onStepChange: handleStepChange,
  saveDashboardView,
  state,
});

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

void (async () => {
  await refreshTree();
  if (state.currentPath != null && !treeHasRelativePath(state.tree, state.currentPath)) {
    state.currentPath = null;
    state.parseResult = null;
    saveDashboardView();
  }
  if (state.currentPath != null) {
    await openVexFile(state.currentPath, { resetFunctionIndex: false });
  }
  renderWorkflowBar();
})();

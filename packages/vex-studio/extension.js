var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/extension.ts
var exports_extension = {};
__export(exports_extension, {
  deactivate: () => deactivate,
  activate: () => activate
});
module.exports = __toCommonJS(exports_extension);
var vscode5 = __toESM(require("vscode"));

// src/cursor-state-reader.ts
var import_node_child_process = require("node:child_process");
var import_node_path = require("node:path");
var EMPTY_STATE = { activeId: null, tabs: [] };
function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string");
}
function isValidComposerEntry(raw) {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  return typeof raw["composerId"] === "string";
}
function resolveDbPath(context) {
  const storageUri = context.storageUri;
  if (storageUri == null) {
    return "";
  }
  return import_node_path.resolve(storageUri.fsPath, "..", "state.vscdb");
}
function queryDb(dbPath) {
  return new Promise((res, rej) => {
    const query = "SELECT value FROM ItemTable WHERE key='composer.composerData'";
    import_node_child_process.execFile("/usr/bin/sqlite3", [dbPath, query], { timeout: 5000 }, (err, stdout) => {
      if (err != null) {
        rej(err);
        return;
      }
      res(stdout.trim());
    });
  });
}
function parseComposerData(raw) {
  if (raw.length === 0) {
    return EMPTY_STATE;
  }
  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    return EMPTY_STATE;
  }
  const data = parsed;
  const selectedIds = toStringArray(data["selectedComposerIds"]);
  const focusedIds = toStringArray(data["lastFocusedComposerIds"]);
  const allComposers = Array.isArray(data["allComposers"]) ? data["allComposers"] : [];
  const selectedSet = new Set(selectedIds);
  const tabs = allComposers.filter(isValidComposerEntry).filter((c) => selectedSet.has(c["composerId"])).map((c) => {
    const obj = c;
    const composerId = obj["composerId"];
    const name = typeof obj["name"] === "string" ? obj["name"] : "";
    return { composerId, name };
  });
  let activeId = null;
  if (focusedIds.length > 0) {
    activeId = focusedIds[0];
  } else if (selectedIds.length > 0) {
    activeId = selectedIds[0];
  }
  return { activeId, tabs };
}
async function readComposerState(context) {
  const dbPath = resolveDbPath(context);
  if (dbPath.length === 0) {
    return EMPTY_STATE;
  }
  const raw = await queryDb(dbPath);
  return parseComposerData(raw);
}

// src/stepper-css.ts
var VEX_STEPPER_INLINE_CSS = `
    :root {
      --vex-purple-300: #c4b5fd;
      --vex-surface: rgba(88, 28, 135, 0.22);
    }
    body {
      margin: 0;
      padding: 6px 8px 8px;
      font-family: var(--vscode-font-family), system-ui, sans-serif;
      font-size: 12px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
    }
    .vex-shell {
      border-radius: 8px;
      padding: 8px 10px 10px;
      overflow: visible;
      background: linear-gradient(145deg, var(--vex-surface), rgba(15, 23, 42, 0.35));
      border: 1px solid rgba(167, 139, 250, 0.28);
      box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.12), 0 6px 20px rgba(15, 23, 42, 0.4);
    }
    .vex-shell--disabled {
      background: linear-gradient(145deg, rgba(50, 50, 60, 0.22), rgba(30, 30, 40, 0.35));
      border-color: rgba(120, 120, 130, 0.25);
      box-shadow: 0 0 0 1px rgba(80, 80, 90, 0.1), 0 6px 20px rgba(15, 23, 42, 0.3);
    }
    .vex-shell--disabled .vex-title,
    .vex-shell--disabled .vex-label,
    .vex-shell--disabled .vex-node-num {
      color: rgba(160, 160, 170, 0.5);
    }
    .vex-shell--disabled .vex-node--active,
    .vex-shell--disabled .vex-node--pending {
      background: rgba(80, 80, 90, 0.35);
      border-color: rgba(140, 140, 150, 0.3);
      box-shadow: none;
      color: rgba(160, 160, 170, 0.5);
    }
    .vex-shell--disabled .vex-connector-line {
      background: rgba(120, 120, 130, 0.3);
      opacity: 0.5;
    }
    .vex-shell--disabled .vex-step {
      pointer-events: none;
      cursor: default;
    }
    .vex-shell--disabled .vex-open-visual {
      border-color: rgba(140, 140, 150, 0.3);
      background: rgba(80, 80, 90, 0.25);
      color: rgba(160, 160, 170, 0.5);
      pointer-events: none;
    }
    .vex-shell-header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-wrap: wrap;
      padding-bottom: 4px;
    }
    .vex-shell-header-right {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .vex-open-visual {
      margin: 0;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(167, 139, 250, 0.45);
      background: rgba(124, 58, 237, 0.25);
      color: var(--vex-purple-300);
      font-family: inherit;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .vex-open-visual:hover {
      background: rgba(124, 58, 237, 0.4);
    }
    .vex-open-visual:focus-visible {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
    .vex-title {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--vex-purple-300);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .vex-track {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0;
      overflow-x: auto;
      overflow-y: visible;
      padding: 2px 0 2px;
    }
    .vex-step-outer {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 0 0 auto;
      overflow: visible;
    }
    button.vex-step {
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      font: inherit;
      color: inherit;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      border-radius: 8px;
      -webkit-tap-highlight-color: transparent;
      -webkit-appearance: none;
      appearance: none;
      overflow: visible;
      box-shadow: none;
    }
    button.vex-step:focus-visible {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
    .vex-node-wrap {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: visible;
    }
    .vex-node {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11px;
      box-sizing: border-box;
      border-style: solid;
      border-width: 1px;
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }
    .vex-node--pending {
      color: rgba(196, 181, 253, 0.75);
      background: radial-gradient(circle at 30% 25%, rgba(192, 132, 252, 0.22), rgba(76, 29, 149, 0.45));
      border-color: rgba(196, 181, 253, 0.35);
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.45);
    }
    .vex-node--active {
      color: #f5f3ff;
      background: radial-gradient(circle at 30% 25%, rgba(216, 180, 254, 0.55), rgba(124, 58, 237, 0.85));
      border-color: rgba(237, 233, 254, 0.65);
      box-shadow:
        0 0 0 1px rgba(237, 233, 254, 0.35),
        0 0 10px rgba(167, 139, 250, 0.22),
        0 3px 10px rgba(76, 29, 149, 0.35);
    }
    button.vex-step:hover .vex-node--pending {
      border-color: rgba(196, 181, 253, 0.55);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.5);
    }
    .vex-node-num {
      line-height: 1;
    }
    .vex-label {
      font-size: 9px;
      font-weight: 600;
      color: rgba(196, 181, 253, 0.75);
      text-align: center;
      max-width: 72px;
      line-height: 1.2;
      transition: color 0.2s ease;
    }
    button.vex-step[aria-current="step"] .vex-label {
      color: #ede9fe;
    }
    .vex-connector {
      flex: 1 1 0;
      min-width: 8px;
      height: 32px;
      display: flex;
      align-items: center;
      align-self: flex-start;
      padding-left: 2px;
      padding-right: 2px;
    }
    .vex-connector-line {
      display: block;
      width: 100%;
      height: 2px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.85), rgba(167, 139, 250, 0.15));
      opacity: 0.85;
    }
    .vex-toggle {
      position: relative;
      width: 32px;
      height: 18px;
      flex-shrink: 0;
      cursor: pointer;
    }
    .vex-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }
    .vex-toggle-track {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: rgba(76, 29, 149, 0.5);
      border: 1px solid rgba(167, 139, 250, 0.3);
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .vex-toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: rgba(196, 181, 253, 0.6);
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .vex-toggle input:checked ~ .vex-toggle-track {
      background: rgba(124, 58, 237, 0.7);
      border-color: rgba(196, 181, 253, 0.5);
    }
    .vex-toggle input:checked ~ .vex-toggle-thumb {
      transform: translateX(14px);
      background: #ede9fe;
    }
    .vex-toggle input:focus-visible ~ .vex-toggle-track {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
`;

// src/stepper-html.ts
function buildStepperHtml() {
  return '<!DOCTYPE html><html lang="en"><head>' + '<meta charset="UTF-8" />' + `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />` + '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' + "<title>Vex</title>" + "<style>" + VEX_STEPPER_INLINE_CSS + "</style></head><body>" + '<div class="vex-shell">' + '<div class="vex-shell-header">' + '<p class="vex-title" id="vex-agent-name">Agent Workflows</p>' + '<div class="vex-shell-header-right">' + '<button type="button" class="vex-open-visual" id="vex-refresh" title="Refresh active agent">&#x21bb;</button>' + '<button type="button" class="vex-open-visual" id="vex-open-visual">Open tree view</button>' + '<label class="vex-toggle" title="Enable workflow tracking">' + '<input type="checkbox" id="vex-workflow-toggle" />' + '<span class="vex-toggle-track"></span>' + '<span class="vex-toggle-thumb"></span>' + "</label>" + "</div></div>" + '<div id="vex-stepper-area"></div>' + "</div>" + "<script>" + INLINE_SCRIPT + "</script></body></html>";
}
var INLINE_SCRIPT = [
  "(function () {",
  "  var vscodeApi = acquireVsCodeApi();",
  "  var STEP_COUNT = 6;",
  "  var activeId = null;",
  "  var activeName = '';",
  "  var stepByTabId = {};",
  "  var workflowEnabled = true;",
  "",
  "  var saved = vscodeApi.getState();",
  "  if (saved && saved.stepByTabId) { stepByTabId = saved.stepByTabId; }",
  "  if (saved && typeof saved.workflowEnabled === 'boolean') { workflowEnabled = saved.workflowEnabled; }",
  "  if (saved && typeof saved.activeId === 'string') { activeId = saved.activeId; }",
  "  if (saved && typeof saved.activeName === 'string') { activeName = saved.activeName; }",
  "",
  "  function saveState() {",
  "    vscodeApi.setState({ activeId: activeId, activeName: activeName, stepByTabId: stepByTabId, workflowEnabled: workflowEnabled });",
  "  }",
  "",
  "  function getStep() {",
  "    if (activeId && stepByTabId[activeId] != null) return stepByTabId[activeId];",
  "    return 0;",
  "  }",
  "",
  "  function buildTrackHtml(activeStep) {",
  '    var labels = ["Describe","Spec","Approve","Build","Verify","Done"];',
  '    var out = "";',
  "    for (var i = 0; i < labels.length; i++) {",
  '      var cls = i === activeStep ? "vex-node vex-node--active" : "vex-node vex-node--pending";',
  `      var aria = i === activeStep ? ' aria-current="step"' : "";`,
  `      out += '<div class="vex-step-outer" role="listitem">'`,
  `        + '<button type="button" class="vex-step"' + aria + ' data-step-index="' + i + '" title="' + labels[i] + '">'`,
  `        + '<span class="vex-node-wrap"><span class="' + cls + '"><span class="vex-node-num">' + (i+1) + "</span></span></span>"`,
  `        + '<span class="vex-label">' + labels[i] + "</span></button></div>";`,
  "      if (i < labels.length - 1) {",
  `        out += '<div class="vex-connector" aria-hidden="true"><span class="vex-connector-line"></span></div>';`,
  "      }",
  "    }",
  "    return out;",
  "  }",
  "",
  "  function syncToggle() {",
  '    var cb = document.getElementById("vex-workflow-toggle");',
  "    if (cb) { cb.checked = workflowEnabled; }",
  "  }",
  "",
  "  function render() {",
  '    var title = document.getElementById("vex-agent-name");',
  "    if (title) {",
  "      title.textContent = (activeName && activeName.length > 0) ? activeName : 'Agent Workflows';",
  "    }",
  '    var shell = document.querySelector(".vex-shell");',
  "    if (shell) {",
  "      if (workflowEnabled) { shell.classList.remove('vex-shell--disabled'); }",
  "      else { shell.classList.add('vex-shell--disabled'); }",
  "    }",
  '    var area = document.getElementById("vex-stepper-area");',
  "    if (area) {",
  `      area.innerHTML = '<div class="vex-track" role="list" aria-label="Workflow steps">' + buildTrackHtml(getStep()) + "</div>";`,
  "    }",
  "    syncToggle();",
  "  }",
  "",
  "  window.addEventListener('message', function (e) {",
  "    var msg = e.data;",
  "    if (!msg) return;",
  "    if (msg.type === 'composerState') {",
  "      var newId = msg.activeId;",
  "      var tabs = msg.tabs || [];",
  "      if (newId !== activeId) {",
  "        activeId = newId;",
  "        activeName = '';",
  "        for (var i = 0; i < tabs.length; i++) {",
  "          if (tabs[i].composerId === newId) {",
  "            activeName = tabs[i].name || '';",
  "            break;",
  "          }",
  "        }",
  "        saveState();",
  "        render();",
  "      }",
  "    }",
  "    if (msg.type === 'workflowConfig') {",
  "      if (msg.stepByTabId) { stepByTabId = msg.stepByTabId; }",
  "      if (typeof msg.enabled === 'boolean') { workflowEnabled = msg.enabled; }",
  "      saveState();",
  "      render();",
  "    }",
  "  });",
  "",
  "  document.addEventListener('click', function (e) {",
  "    var stepBtn = e.target.closest('.vex-step');",
  "    if (stepBtn && activeId) {",
  "      var stepIdx = parseInt(stepBtn.getAttribute('data-step-index'), 10);",
  "      if (!isNaN(stepIdx) && stepIdx >= 0 && stepIdx < STEP_COUNT) {",
  "        stepByTabId[activeId] = stepIdx;",
  "        saveState();",
  "        render();",
  "        vscodeApi.postMessage({ type: 'stepChanged', activeId: activeId, step: stepIdx });",
  "      }",
  "      return;",
  "    }",
  "    var refreshBtn = e.target.closest('#vex-refresh');",
  "    if (refreshBtn) {",
  '      vscodeApi.postMessage({ type: "refreshWindow" });',
  "      return;",
  "    }",
  "    var openBtn = e.target.closest('#vex-open-visual');",
  "    if (openBtn) {",
  '      vscodeApi.postMessage({ type: "openEditorVisual" });',
  "      return;",
  "    }",
  "  });",
  "",
  "  var toggleEl = document.getElementById('vex-workflow-toggle');",
  "  if (toggleEl) {",
  "    toggleEl.addEventListener('change', function () {",
  "      workflowEnabled = toggleEl.checked;",
  "      saveState();",
  "      render();",
  "      vscodeApi.postMessage({ type: 'toggleChanged', enabled: workflowEnabled });",
  "    });",
  "  }",
  "",
  "  render();",
  '  vscodeApi.postMessage({ type: "requestState" });',
  "})();"
].join(`
`);

// src/vex-tree-editor-provider.ts
var vscode3 = __toESM(require("vscode"));

// src/get-editor-html.ts
function getEditorVisualHtml(webview, scriptUri) {
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src ${webview.cspSource}`
  ].join("; ");
  const scriptUrl = String(scriptUri);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vex</title>
  <style>
    html,
    body {
      height: 100%;
      margin: 0;
      box-sizing: border-box;
    }
    body {
      height: 100vh;
      font-family: var(--vscode-font-family), system-ui, sans-serif;
      font-size: 12px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .vex-ed-root {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .vex-ed-toolbar {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(167, 139, 250, 0.25);
      flex-shrink: 0;
    }
    .vex-ed-zoom {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .vex-ed-zoom-btn {
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(167, 139, 250, 0.45);
      background: rgba(15, 23, 42, 0.35);
      color: inherit;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.2;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
    }
    .vex-ed-zoom-btn:hover {
      background: rgba(124, 58, 237, 0.35);
    }
    .vex-ed-zoom-btn:focus-visible {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
    .vex-ed-zoom-label {
      font-size: 10px;
      font-weight: 600;
      min-width: 36px;
      text-align: center;
      opacity: 0.9;
    }
    .vex-ed-title {
      font-size: 12px;
      font-weight: 600;
      flex: 1 1 auto;
      min-width: 0;
    }
    .vex-ed-tabs {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }
    .vex-ed-tab {
      margin: 0;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(167, 139, 250, 0.45);
      background: rgba(15, 23, 42, 0.35);
      color: inherit;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
    }
    .vex-ed-tab--active {
      background: rgba(124, 58, 237, 0.45);
      border-color: rgba(196, 181, 253, 0.55);
    }
    .vex-ed-idle {
      padding: 20px 16px;
      opacity: 0.9;
    }
    .vex-ed-error {
      padding: 16px;
      color: var(--vscode-errorForeground);
    }
    .vex-ed-error ul {
      padding-left: 20px;
    }
    .vex-ed-main {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      position: relative;
    }
    .vex-ed-viewport {
      flex: 1 1 auto;
      min-height: 120px;
      overflow: auto;
      cursor: grab;
      overscroll-behavior: contain;
      touch-action: none;
      position: relative;
      user-select: none;
    }
    .vex-ed-viewport--dragging {
      cursor: grabbing;
    }
    .vex-ed-pan {
      box-sizing: content-box;
      display: block;
      min-width: 100%;
      overflow: visible;
      padding: 50vh 50vw;
      width: max-content;
    }
    .vex-ed-content {
      box-sizing: border-box;
      display: inline-block;
      max-width: none;
      min-width: 0;
      vertical-align: top;
      width: max-content;
    }
    .vex-ed-placeholder {
      opacity: 0.8;
    }
    .vex-node-card {
      cursor: pointer;
      transition: filter 0.16s ease, stroke-width 0.16s ease;
    }
    .vex-node-card:hover {
      stroke-width: 2.75;
      filter: drop-shadow(0 0 4px rgba(196, 181, 253, 0.5))
        drop-shadow(0 0 12px rgba(167, 139, 250, 0.22));
    }
    .vex-inline-edit-inner {
      display: block;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
    .vex-inline-edit-inner textarea {
      user-select: text;
    }
    .vex-inline-edit-fo textarea:focus {
      box-shadow: inset 0 0 0 2px rgba(167, 139, 250, 0.65);
    }
  </style>
</head>
<body>
  <div id="vex-ed-root" class="vex-ed-root">
    <header class="vex-ed-toolbar">
      <span id="vex-ed-title" class="vex-ed-title">Vex</span>
      <div class="vex-ed-zoom" role="group" aria-label="Zoom">
        <button type="button" class="vex-ed-zoom-btn" id="vex-ed-zoom-out" title="Zoom out">−</button>
        <span id="vex-ed-zoom-pct" class="vex-ed-zoom-label">100%</span>
        <button type="button" class="vex-ed-zoom-btn" id="vex-ed-zoom-in" title="Zoom in">+</button>
        <button type="button" class="vex-ed-zoom-btn" id="vex-ed-zoom-reset" title="Reset view">⊙</button>
      </div>
      <div id="vex-ed-tabs" class="vex-ed-tabs"></div>
    </header>
    <div id="vex-ed-idle" class="vex-ed-idle" hidden></div>
    <div id="vex-ed-error" class="vex-ed-error" hidden></div>
    <div id="vex-ed-main" class="vex-ed-main" hidden>
      <div id="vex-ed-viewport" class="vex-ed-viewport">
        <div id="vex-ed-pan" class="vex-ed-pan">
          <div id="vex-ed-content" class="vex-ed-content"></div>
        </div>
      </div>
    </div>
  </div>
  <script src="${scriptUrl}"></script>
</body>
</html>`;
}

// src/vex-parse/stack-and-lines.ts
function countLeadingSpaces(rawLine) {
  const match = /^ */u.exec(rawLine);
  return match?.[0].length ?? 0;
}
function parseDescribeHeaderFromLine(content) {
  const trimmed = content.trimStart();
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith("describe")) {
    return { label: null };
  }
  const afterKeyword = trimmed.slice(8).trimStart();
  if (!afterKeyword.startsWith(":")) {
    return { label: null };
  }
  const label = afterKeyword.slice(1).trim();
  return { label: label.length > 0 ? label : null };
}
function labelAfterKeywordPrefix(trimmed, keywordLen) {
  const after = trimmed.slice(keywordLen).trimStart();
  if (!after.startsWith(":")) {
    return [false, ""];
  }
  return [true, after.slice(1).trim()];
}
function parseLabelSpanWithPattern(content, pattern) {
  const trimmed = content.trimStart();
  const m = pattern.exec(trimmed);
  if (m == null) {
    return { span: null };
  }
  const rest = trimmed.slice(m[0].length);
  const prefixOffset = content.length - trimmed.length;
  const startInTrimmed = m[0].length + (rest.length - rest.trimStart().length);
  const endInTrimmed = m[0].length + rest.trimEnd().length;
  return {
    span: {
      end: prefixOffset + endInTrimmed,
      start: prefixOffset + startInTrimmed
    }
  };
}
var DESCRIBE_LABEL_PATTERN = /^describe\s*:\s*/iu;
var LIST_LABEL_PATTERN = /^(when|and|it)\s*:\s*/iu;
function parseDescribeLabelSpanInContent(content) {
  return parseLabelSpanWithPattern(content, DESCRIBE_LABEL_PATTERN);
}
function parseListLabelSpanInContent(content) {
  return parseLabelSpanWithPattern(content, LIST_LABEL_PATTERN);
}
function parseListLineParts(content) {
  const trimmed = content.trimStart();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("when")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 4);
    if (ok) {
      return { keyword: "WHEN", label };
    }
  }
  if (lower.startsWith("and")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 3);
    if (ok) {
      return { keyword: "AND", label };
    }
  }
  if (lower.startsWith("it")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 2);
    if (ok) {
      return { keyword: "IT", label };
    }
  }
  return { keyword: null, label: "" };
}
function popDeeperThan(stack, leadingSpaces) {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent <= leadingSpaces) {
      break;
    }
    stack.pop();
  }
}
function popSiblingDescribesAtIndent(stack, describeIndent) {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent !== describeIndent) {
      break;
    }
    if (top.kind !== "describe") {
      break;
    }
    stack.pop();
  }
}
function popWhenSiblingsAtIndent(stack, whenIndent) {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent !== whenIndent) {
      break;
    }
    if (top.kind !== "when") {
      break;
    }
    stack.pop();
  }
}
function popCompletedListSiblingsAtIndent(stack, leadingSpaces, onError, lineNo) {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent !== leadingSpaces) {
      break;
    }
    if (top.kind === "it") {
      stack.pop();
      continue;
    }
    if (top.kind === "and") {
      if (top.node.child == null) {
        onError(lineNo, "Complete this AND with a nested AND or IT before a sibling branch at the same indent.");
        return false;
      }
      stack.pop();
      continue;
    }
    break;
  }
  return true;
}
function popStackForListLine(stack, leadingSpaces, keyword, onError, lineNo) {
  popDeeperThan(stack, leadingSpaces);
  if (keyword === "WHEN") {
    popWhenSiblingsAtIndent(stack, leadingSpaces);
    return true;
  }
  return popCompletedListSiblingsAtIndent(stack, leadingSpaces, onError, lineNo);
}
function peekStack(stack) {
  const parent = stack.at(-1);
  if (parent == null) {
    return { parent: null };
  }
  return { parent };
}
function pushError(ctx, line, message) {
  ctx.errors.push({ line, message });
}

// src/vex-parse/statement-handlers.ts
function processDescribeDeclarationLine(input) {
  const { content, ctx, leadingSpaces, lineNo, lineStartOffset } = input;
  const { label } = parseDescribeHeaderFromLine(content);
  if (label == null) {
    pushError(ctx, lineNo, 'Expected a line like "describe: Label" (describe may be upper or lower case).');
    return;
  }
  const spanParsed = parseDescribeLabelSpanInContent(content);
  if (spanParsed.span == null) {
    pushError(ctx, lineNo, "Could not locate describe label text in this line.");
    return;
  }
  const spanLocal = spanParsed.span;
  const labelSpan = {
    end: lineStartOffset + leadingSpaces + spanLocal.end,
    start: lineStartOffset + leadingSpaces + spanLocal.start
  };
  popDeeperThan(ctx.stack, leadingSpaces);
  popSiblingDescribesAtIndent(ctx.stack, leadingSpaces);
  const block = { label, labelSpan, line: lineNo, nestedDescribes: [], whens: [] };
  if (leadingSpaces === 0) {
    ctx.document.describes.push(block);
    ctx.stack.length = 0;
    const frame2 = { indent: 0, kind: "describe", node: block };
    ctx.stack.push(frame2);
    return;
  }
  const { parent } = peekStack(ctx.stack);
  if (parent == null || parent.kind !== "describe") {
    pushError(ctx, lineNo, "Nested describe must be indented under a describe block.");
    return;
  }
  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "describe must be indented one level (4 spaces) deeper than its parent describe.");
    return;
  }
  parent.node.nestedDescribes.push(block);
  const frame = { indent: leadingSpaces, kind: "describe", node: block };
  ctx.stack.push(frame);
}
function processWhenLine(input) {
  const { ctx, label, labelSpan, leadingSpaces, lineNo, parent } = input;
  if (parent == null || parent.kind !== "describe") {
    pushError(ctx, lineNo, "when must appear directly under a describe block (4 spaces under the describe line).");
    return;
  }
  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "when must be indented 4 spaces under its parent describe.");
    return;
  }
  const whenNode = { branches: [], label, labelSpan, line: lineNo };
  parent.node.whens.push(whenNode);
  const frame = { indent: leadingSpaces, kind: "when", node: whenNode };
  ctx.stack.push(frame);
}
function processAndLine(input) {
  const { ctx, label, labelSpan, leadingSpaces, lineNo, parent } = input;
  if (parent == null) {
    pushError(ctx, lineNo, "and must appear under a when or another and.");
    return;
  }
  if (parent.kind === "describe" || parent.kind === "it") {
    pushError(ctx, lineNo, "and must appear under a when or another and.");
    return;
  }
  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "and must be indented one level (4 spaces) deeper than its parent.");
    return;
  }
  if (parent.kind === "when") {
    const and2 = { child: undefined, kind: "and", label, labelSpan, line: lineNo };
    parent.node.branches.push(and2);
    const frame2 = { indent: leadingSpaces, kind: "and", node: and2 };
    ctx.stack.push(frame2);
    return;
  }
  if (parent.node.child != null) {
    pushError(ctx, lineNo, "This and already has a child; use a nested and for deeper branches.");
    return;
  }
  const and = { child: undefined, kind: "and", label, labelSpan, line: lineNo };
  parent.node.child = and;
  const frame = { indent: leadingSpaces, kind: "and", node: and };
  ctx.stack.push(frame);
}
function processItLine(input) {
  const { ctx, label, labelSpan, leadingSpaces, lineNo, parent } = input;
  const it = { kind: "it", label, labelSpan, line: lineNo };
  if (parent == null) {
    pushError(ctx, lineNo, "it must appear under a when or and.");
    return;
  }
  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "it must be indented one level (4 spaces) deeper than its parent.");
    return;
  }
  if (parent.kind === "describe") {
    pushError(ctx, lineNo, "it must appear under a when or and, not directly under a describe.");
    return;
  }
  if (parent.kind === "when") {
    parent.node.branches.push(it);
    const frame = { indent: leadingSpaces, kind: "it", node: it };
    ctx.stack.push(frame);
    return;
  }
  if (parent.kind === "and") {
    if (parent.node.child != null) {
      pushError(ctx, lineNo, "This and already has a child.");
      return;
    }
    parent.node.child = it;
    const frame = { indent: leadingSpaces, kind: "it", node: it };
    ctx.stack.push(frame);
    return;
  }
  pushError(ctx, lineNo, "it cannot appear nested under another it.");
}

// src/vex-parse/list-and-document.ts
function processListLine(input) {
  const { content, ctx, leadingSpaces, lineNo, lineStartOffset } = input;
  const { keyword, label } = parseListLineParts(content);
  if (keyword == null) {
    pushError(ctx, lineNo, 'Expected a line starting with "when:", "and:", or "it:" (case-insensitive).');
    return;
  }
  if (label === "") {
    pushError(ctx, lineNo, "Missing text after the colon; add a non-empty label.");
    return;
  }
  const spanParsed = parseListLabelSpanInContent(content);
  if (spanParsed.span == null) {
    pushError(ctx, lineNo, "Could not locate label text in this line.");
    return;
  }
  const spanLocal = spanParsed.span;
  const labelSpan = {
    end: lineStartOffset + leadingSpaces + spanLocal.end,
    start: lineStartOffset + leadingSpaces + spanLocal.start
  };
  const popped = popStackForListLine(ctx.stack, leadingSpaces, keyword, (line, message) => {
    pushError(ctx, line, message);
  }, lineNo);
  if (!popped) {
    return;
  }
  const { parent } = peekStack(ctx.stack);
  if (keyword === "WHEN") {
    processWhenLine({ ctx, label, labelSpan, leadingSpaces, lineNo, parent });
    return;
  }
  if (keyword === "AND") {
    processAndLine({ ctx, label, labelSpan, leadingSpaces, lineNo, parent });
    return;
  }
  processItLine({ ctx, label, labelSpan, leadingSpaces, lineNo, parent });
}
function processVexLine(input) {
  const { ctx, line } = input;
  const { lineNo, lineStartOffset, rawLine } = line;
  if (rawLine.trim() === "") {
    return;
  }
  if (rawLine.includes("\t")) {
    pushError(ctx, lineNo, "Tabs are not allowed; use spaces for indentation.");
    return;
  }
  const leadingSpaces = countLeadingSpaces(rawLine);
  const content = rawLine.slice(leadingSpaces);
  if (leadingSpaces !== 0 && leadingSpaces % 4 !== 0) {
    pushError(ctx, lineNo, "Indentation must use a multiple of 4 spaces.");
    return;
  }
  const { keyword } = parseListLineParts(content);
  if (keyword != null) {
    if (leadingSpaces === 0) {
      pushError(ctx, lineNo, "when, and, it lines must be indented under a describe block (multiples of 4 spaces).");
      return;
    }
    if (leadingSpaces < 4) {
      pushError(ctx, lineNo, "The first when under a describe must be indented with at least 4 spaces.");
      return;
    }
    processListLine({ content, ctx, leadingSpaces, lineNo, lineStartOffset });
    return;
  }
  const { label: describeLabel } = parseDescribeHeaderFromLine(content);
  if (describeLabel != null) {
    processDescribeDeclarationLine({ content, ctx, leadingSpaces, lineNo, lineStartOffset });
    return;
  }
  if (leadingSpaces === 0) {
    pushError(ctx, lineNo, 'Expected a top-level line starting with "describe:".');
    return;
  }
  pushError(ctx, lineNo, 'Expected a line starting with "describe:", "when:", "and:", or "it:" (case-insensitive) at the correct indent.');
}
function parseVexDocument(source) {
  const errors = [];
  const document = { describes: [] };
  const ctx = { document, errors, stack: [] };
  const lines = source.split(/\r?\n/u);
  let lineNo = 0;
  let lineStartOffset = 0;
  lines.forEach((rawLine, lineIndex) => {
    lineNo += 1;
    processVexLine({ ctx, line: { lineNo, lineStartOffset, rawLine } });
    lineStartOffset += rawLine.length;
    if (lineIndex < lines.length - 1) {
      lineStartOffset += 1;
    }
  });
  if (document.describes.length === 0 && errors.length === 0) {
    pushError(ctx, 1, 'Expected at least one describe block (a line like "describe: Label").');
  }
  const ok = errors.length === 0;
  const documentOut = ok ? document : undefined;
  return { document: documentOut, errors, ok };
}
// src/vex-parse/validate.ts
function countItNodes(body) {
  if (body == null) {
    return 0;
  }
  if (body.kind === "it") {
    return 1;
  }
  return countItNodes(body.child);
}
function collectStructureErrors(body, path) {
  const out = [];
  if (body == null) {
    out.push({ line: 0, message: `${path}: missing body (add an it or and chain).` });
    return out;
  }
  if (body.kind === "it") {
    return out;
  }
  if (body.child == null) {
    out.push({
      line: body.line,
      message: `${path} (and "${body.label}"): missing child; add a nested and or an it.`
    });
    return out;
  }
  return out.concat(collectStructureErrors(body.child, `${path} > and "${body.label}"`));
}
function validateWhenBranch(pathPrefix, when) {
  const path = `${pathPrefix} > when "${when.label}"`;
  const branchErrors = [];
  if (when.branches.length === 0) {
    branchErrors.push({ line: when.line, message: `${path}: add at least one branch (an it or and chain).` });
    return branchErrors;
  }
  const directIts = when.branches.filter((b) => b.kind === "it");
  if (directIts.length > 1) {
    const extra = directIts[1];
    branchErrors.push({
      line: extra.line,
      message: `${path}: a when may have at most one it at this level; use and for additional branches.`
    });
  }
  when.branches.forEach((branch, i) => {
    const branchPath = `${path} > branch ${String(i + 1)}`;
    const structural = collectStructureErrors(branch, branchPath);
    branchErrors.push(...structural);
    const itCount = countItNodes(branch);
    const skipZero = itCount === 0 && structural.length > 0;
    if (skipZero || itCount === 1) {
      return;
    }
    branchErrors.push({
      line: branch.line,
      message: `${branchPath}: expected exactly one it (found ${String(itCount)}).`
    });
  });
  return branchErrors;
}
function collectDuplicateLabelsInSiblings(blocks, path) {
  const seen = new Set;
  const out = [];
  blocks.forEach((b) => {
    if (seen.has(b.label)) {
      out.push({ line: b.line, message: `${path}: duplicate describe label "${b.label}" among siblings.` });
    }
    seen.add(b.label);
  });
  return out;
}
function validateDescribeBlock(block, pathPrefix) {
  const errors = [];
  const path = `${pathPrefix}describe "${block.label}"`;
  errors.push(...collectDuplicateLabelsInSiblings(block.nestedDescribes, path));
  block.nestedDescribes.forEach((nested) => {
    errors.push(...validateDescribeBlock(nested, `${path} > `));
  });
  block.whens.forEach((when) => {
    errors.push(...validateWhenBranch(path, when));
  });
  return errors;
}
function validateVexDocument(document) {
  const errors = [];
  errors.push(...collectDuplicateLabelsInSiblings(document.describes, "Document"));
  document.describes.forEach((root) => {
    errors.push(...validateDescribeBlock(root, ""));
  });
  return errors;
}
function parseAndValidateVexDocument(source) {
  const parsed = parseVexDocument(source);
  if (!parsed.ok) {
    return { document: undefined, errors: parsed.errors, ok: false };
  }
  const doc = parsed.document;
  if (doc == null) {
    return {
      document: undefined,
      errors: [{ line: 0, message: "Internal parse state: document missing when ok is true." }],
      ok: false
    };
  }
  const structuralErrors = validateVexDocument(doc);
  if (structuralErrors.length > 0) {
    return { document: undefined, errors: structuralErrors, ok: false };
  }
  return { document: doc, errors: [], ok: true };
}
// src/vex-edit-label.ts
var vscode = __toESM(require("vscode"));
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function isVexApplyLabelEdit(value) {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type !== "vexApplyLabelEdit") {
    return false;
  }
  if (typeof value.start !== "number") {
    return false;
  }
  if (typeof value.end !== "number") {
    return false;
  }
  if (typeof value.text !== "string") {
    return false;
  }
  return value.start <= value.end;
}
async function applyVexLabelReplace(uri, start, end, text) {
  const doc = await vscode.workspace.openTextDocument(uri);
  const len = doc.getText().length;
  if (start < 0) {
    await vscode.window.showErrorMessage("Invalid label range.");
    return;
  }
  if (end > len) {
    await vscode.window.showErrorMessage("Invalid label range.");
    return;
  }
  if (start > end) {
    await vscode.window.showErrorMessage("Invalid label range.");
    return;
  }
  const range = new vscode.Range(doc.positionAt(start), doc.positionAt(end));
  if (doc.getText(range) === text) {
    return;
  }
  const edit = new vscode.WorkspaceEdit;
  edit.replace(uri, range, text);
  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied) {
    return;
  }
  const saved = await doc.save();
  if (!saved) {
    await vscode.window.showErrorMessage("Could not save the .vex file to disk.");
  }
}

// src/vex-tree-custom-document.ts
class VexTreeCustomDocument {
  uri;
  constructor(uri) {
    this.uri = uri;
  }
  dispose() {}
}

// src/vex-tree-load-text.ts
var vscode2 = __toESM(require("vscode"));
async function loadVexFileText(uri) {
  try {
    const doc = await vscode2.workspace.openTextDocument(uri);
    return doc.getText();
  } catch {
    const bytes = await vscode2.workspace.fs.readFile(uri);
    return new TextDecoder().decode(bytes);
  }
}

// src/vex-tree-editor-provider.ts
var DEBOUNCE_MS = 150;
function resolveVexTreeEditor(input) {
  const { context, document, token, webviewPanel } = input;
  if (token.isCancellationRequested) {
    return;
  }
  const extensionUri = context.extensionUri;
  const mediaRootUri = vscode3.Uri.joinPath(extensionUri, "media");
  const scriptOnDisk = vscode3.Uri.joinPath(mediaRootUri, "editor-visual.js");
  webviewPanel.webview.options = {
    enableScripts: true,
    localResourceRoots: [extensionUri, mediaRootUri]
  };
  const scriptUri = webviewPanel.webview.asWebviewUri(scriptOnDisk);
  webviewPanel.webview.html = getEditorVisualHtml(webviewPanel.webview, scriptUri);
  let debounceTimer;
  const pushState = async () => {
    const text = await loadVexFileText(document.uri);
    const result = parseVexDocument(text);
    if (!result.ok) {
      webviewPanel.webview.postMessage({
        payload: { errors: result.errors, fileName: document.uri.fsPath, kind: "parseError" },
        type: "vexVisual"
      });
      return;
    }
    if (result.document == null) {
      return;
    }
    webviewPanel.webview.postMessage({
      payload: { document: result.document, fileName: document.uri.fsPath, kind: "document" },
      type: "vexVisual"
    });
  };
  const subReady = webviewPanel.webview.onDidReceiveMessage((message) => {
    if (isVexApplyLabelEdit(message)) {
      applyVexLabelReplace(document.uri, message.start, message.end, message.text);
      return;
    }
    if (typeof message === "object" && message !== null && "type" in message && message.type === "vexVisualReady") {
      pushState();
    }
  });
  const subDoc = vscode3.workspace.onDidChangeTextDocument((e) => {
    if (e.document.uri.toString() !== document.uri.toString()) {
      return;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      pushState();
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
function createVexTreeEditorProvider(context) {
  return {
    async openCustomDocument(uri, _openContext, token) {
      if (token.isCancellationRequested) {
        throw new vscode3.CancellationError;
      }
      await loadVexFileText(uri);
      return new VexTreeCustomDocument(uri);
    },
    resolveCustomEditor(document, webviewPanel, token) {
      return new Promise(function(resolve2, reject) {
        setTimeout(function() {
          if (token.isCancellationRequested) {
            resolve2();
            return;
          }
          try {
            resolveVexTreeEditor({ context, document, token, webviewPanel });
            resolve2();
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        }, 0);
      });
    }
  };
}

// src/workflow-vex-lint.ts
var import_node_fs = require("node:fs");
var vscode4 = __toESM(require("vscode"));
async function lintAllVexFiles() {
  const files = await vscode4.workspace.findFiles("**/*.vex", "**/node_modules/**");
  const errors = [];
  files.forEach((uri) => {
    const content = safeRead(uri.fsPath);
    if (content.length === 0) {
      return;
    }
    const result = parseAndValidateVexDocument(content);
    if (result.ok) {
      return;
    }
    const relativePath = vscode4.workspace.asRelativePath(uri);
    result.errors.forEach((err) => {
      errors.push(`${relativePath}:${String(err.line)}: ${err.message}`);
    });
  });
  return { errors, ok: errors.length === 0 };
}
function safeRead(filePath) {
  try {
    return import_node_fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// src/workflow-state.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var FILENAME = ".vex-workflow";
function workflowStatePath(workspaceRoot) {
  return import_node_path2.join(workspaceRoot, FILENAME);
}
function writeWorkflowState(workspaceRoot, state) {
  import_node_fs2.writeFileSync(workflowStatePath(workspaceRoot), JSON.stringify(state, null, 2), "utf-8");
}
var EMPTY_WORKFLOW = { activeId: null, enabled: false, step: 0 };
function readWorkflowState(workspaceRoot) {
  const raw = safeReadFile(workflowStatePath(workspaceRoot));
  if (raw.length === 0) {
    return EMPTY_WORKFLOW;
  }
  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    return EMPTY_WORKFLOW;
  }
  const obj = parsed;
  if (typeof obj["step"] !== "number") {
    return EMPTY_WORKFLOW;
  }
  return {
    activeId: typeof obj["activeId"] === "string" ? obj["activeId"] : null,
    enabled: obj["enabled"] === true,
    step: obj["step"]
  };
}
function deleteWorkflowState(workspaceRoot) {
  safeUnlink(workflowStatePath(workspaceRoot));
}
function safeReadFile(filePath) {
  try {
    return import_node_fs2.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}
function safeUnlink(filePath) {
  try {
    import_node_fs2.unlinkSync(filePath);
  } catch {}
}

// src/workflow-hooks-manager.ts
var import_node_fs3 = require("node:fs");
var import_node_path3 = require("node:path");
var HOOK_SCRIPT_PATH = ".cursor/hooks/vex-step-guard.sh";
var HOOKS_JSON_PATH = ".cursor/hooks.json";
var VEX_HOOK_ENTRIES = [
  { command: HOOK_SCRIPT_PATH, matcher: "Write" },
  { command: HOOK_SCRIPT_PATH, matcher: "Delete" },
  { command: HOOK_SCRIPT_PATH, matcher: "Shell" }
];
function installHooks(workspaceRoot) {
  writeHookScript(workspaceRoot);
  mergeHooksJson(workspaceRoot);
}
function uninstallHooks(workspaceRoot) {
  removeHookScript(workspaceRoot);
  unmergeHooksJson(workspaceRoot);
}
function writeHookScript(workspaceRoot) {
  const filePath = import_node_path3.join(workspaceRoot, HOOK_SCRIPT_PATH);
  import_node_fs3.mkdirSync(import_node_path3.join(workspaceRoot, ".cursor", "hooks"), { recursive: true });
  import_node_fs3.writeFileSync(filePath, HOOK_SCRIPT_CONTENT, { mode: 493 });
}
function removeHookScript(workspaceRoot) {
  const filePath = import_node_path3.join(workspaceRoot, HOOK_SCRIPT_PATH);
  try {
    import_node_fs3.unlinkSync(filePath);
  } catch {}
}
function readHooksJson(workspaceRoot) {
  const filePath = import_node_path3.join(workspaceRoot, HOOKS_JSON_PATH);
  if (!import_node_fs3.existsSync(filePath)) {
    return { hooks: { preToolUse: [] }, version: 1 };
  }
  const raw = import_node_fs3.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
function writeHooksJson(workspaceRoot, data) {
  const filePath = import_node_path3.join(workspaceRoot, HOOKS_JSON_PATH);
  import_node_fs3.writeFileSync(filePath, JSON.stringify(data, null, 2) + `
`, "utf-8");
}
function isVexEntry(entry) {
  return entry.command === HOOK_SCRIPT_PATH;
}
function mergeHooksJson(workspaceRoot) {
  const data = readHooksJson(workspaceRoot);
  const existing = data.hooks.preToolUse ?? [];
  const alreadyInstalled = existing.some(isVexEntry);
  if (alreadyInstalled) {
    return;
  }
  data.hooks.preToolUse = [...VEX_HOOK_ENTRIES, ...existing];
  writeHooksJson(workspaceRoot, data);
}
function unmergeHooksJson(workspaceRoot) {
  const filePath = import_node_path3.join(workspaceRoot, HOOKS_JSON_PATH);
  if (!import_node_fs3.existsSync(filePath)) {
    return;
  }
  const data = readHooksJson(workspaceRoot);
  const existing = data.hooks.preToolUse ?? [];
  data.hooks.preToolUse = existing.filter((e) => !isVexEntry(e));
  writeHooksJson(workspaceRoot, data);
}
var HOOK_SCRIPT_CONTENT = `#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)

REPO_ROOT=$(echo "$INPUT" | jq -r '.workspace_roots[0] // empty')
[ -z "$REPO_ROOT" ] && echo '{"permission": "allow"}' && exit 0

STATE_FILE="$REPO_ROOT/.vex-workflow"

if [ ! -f "$STATE_FILE" ]; then
  echo '{"permission": "allow"}'
  exit 0
fi

ENABLED=$(jq -r '.enabled // false' "$STATE_FILE" 2>/dev/null)
STEP=$(jq -r '.step // -1' "$STATE_FILE" 2>/dev/null)

if [ "$ENABLED" != "true" ]; then
  echo '{"permission": "allow"}'
  exit 0
fi

TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

BASENAME=$(basename "$FILE")

advance_step() {
  local NEXT_STEP="$1"
  local NEXT_NAME="$2"
  ACTIVE_ID=$(jq -r '.activeId // ""' "$STATE_FILE" 2>/dev/null)
  printf '{"step":%d,"enabled":true,"activeId":"%s"}' "$NEXT_STEP" "$ACTIVE_ID" > "$STATE_FILE"
  AGENT_MSG="The workflow has advanced to the **$NEXT_NAME** step. The .vex-advance file was intercepted — no file was created. You will receive updated instructions in your next context."
  echo "{\\"permission\\": \\"deny\\", \\"agent_message\\": $(echo "$AGENT_MSG" | jq -Rs .)}"
  exit 2
}

deny_with_msg() {
  local AGENT_MSG="$1"
  local USER_MSG="$2"
  echo "{\\"permission\\": \\"deny\\", \\"agent_message\\": $(echo "$AGENT_MSG" | jq -Rs .), \\"user_message\\": $(echo "$USER_MSG" | jq -Rs .)}"
  exit 2
}

# Describe step — block everything except the .vex-advance signal
if [ "$STEP" = "0" ]; then
  if [ "$TOOL" = "Write" ] && [ "$BASENAME" = ".vex-advance" ]; then
    advance_step 1 "Spec"
  fi
  deny_with_msg     "You are in the **Describe** step of the Vex workflow. You have NO write access. Focus on understanding the user's requirements and asking clarifying questions. When ready, write \\\`.vex-advance\\\` with the content \\\`spec\\\`."     "Blocked: agent attempted to use $TOOL during the Describe step (no write access)."
fi

# Spec step — allow .vex file writes only, block everything else
if [ "$STEP" = "1" ]; then
  if [ "$TOOL" = "Write" ] && [ "$BASENAME" = ".vex-advance" ]; then
    advance_step 2 "Approve"
  fi
  if [ "$TOOL" = "Write" ] && [[ "$FILE" == *.vex ]]; then
    echo '{"permission": "allow"}'
    exit 0
  fi
  deny_with_msg     "You are in the **Spec** step of the Vex workflow. You may ONLY write \`.vex\` files. All other writes, deletes, and shell commands are blocked. When all specs are complete, write \`.vex-advance\` with the content \`approve\`."     "Blocked: agent attempted to use $TOOL on a non-.vex file during the Spec step."
fi

# Approve step — block everything, user is reviewing
if [ "$STEP" = "2" ]; then
  deny_with_msg     "You are in the **Approve** step of the Vex workflow. STOP. Do not take any actions. The user is reviewing your specs. Wait for them to approve or request changes."     "Blocked: agent attempted to use $TOOL during the Approve step (waiting for user review)."
fi

echo '{"permission": "allow"}'
`;

// src/workflow-rule-writer.ts
var import_node_fs4 = require("node:fs");
var import_node_path4 = require("node:path");
var RULE_FILENAME = ".cursor/rules/vex-workflow.mdc";
function rulePath(workspaceRoot) {
  return import_node_path4.join(workspaceRoot, RULE_FILENAME);
}
var STEP_RULES = [
  describeStepRule(),
  specStepRule(),
  approveStepRule(),
  buildStepRule(),
  verifyStepRule(),
  doneStepRule()
];
function writeWorkflowRule(workspaceRoot, step, lintErrors) {
  const filePath = rulePath(workspaceRoot);
  import_node_fs4.mkdirSync(import_node_path4.dirname(filePath), { recursive: true });
  let content = STEP_RULES[step] ?? "";
  if (lintErrors != null && lintErrors.length > 0 && step === 1) {
    content = injectLintErrors(content, lintErrors);
  }
  import_node_fs4.writeFileSync(filePath, content, "utf-8");
}
function injectLintErrors(ruleContent, errors) {
  const errorBlock = [
    "",
    "### VALIDATION ERRORS",
    "",
    "Your previous `.vex` files have syntax or structural errors that **must** be fixed before you can advance.",
    "Fix every error listed below, then write `.vex-advance` again.",
    "",
    "```",
    ...errors,
    "```",
    ""
  ].join(`
`);
  return ruleContent + errorBlock;
}
function deleteWorkflowRule(workspaceRoot) {
  try {
    import_node_fs4.unlinkSync(rulePath(workspaceRoot));
  } catch {}
}
function describeStepRule() {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Describe Step (Step 1 of 6)

You are operating inside the **Vex workflow**. The current step is **Describe**.

### Your Role

The user is describing a feature they want built. Your only job right now is to **fully understand what they want**.

1. Read the user's message carefully.
2. If anything is ambiguous, unclear, or under-specified, ask **specific** clarifying questions. Group them into a concise numbered list.
3. Keep asking until you are confident you understand every acceptance criterion.
4. When you have no remaining questions, signal that you are ready to move on.

### Constraints

- **You have NO write access.** Do not create, modify, or delete any files. Do not run shell commands. Do not generate code. If you attempt a write it will be blocked.
- Only output conversational text — questions, summaries, and confirmations.

### Advancing to the Next Step

When you are certain you fully understand the requirements and have no more questions, you **must** write the file \`.vex-advance\` with the single word \`spec\` as its content. This is the ONLY file you are permitted to write. The system will intercept this write, advance the workflow to the **Spec** step, and give you further instructions.

Do **not** advance if you still have open questions. Ask them first.
`;
}
function specStepRule() {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Spec Step (Step 2 of 6)

You are operating inside the **Vex workflow**. The current step is **Spec**.

### Your Role

Based on the requirements gathered in the Describe step, you must now write \`.vex\` spec files that fully describe every behavior of the feature **before** any code is written.

A \`.vex\` file is a plain-text spec format that maps the feature into a tree of behaviors:

\`\`\`
describe: Calculator
    describe: Display
        when: the app opens
            it: Shows the digit 0 on the screen
        when: a new result is ready
            it: Replaces the display with the result
    describe: Operations
        when: the user taps an operator
            it: Stores the operator and waits for the next operand
        when: the user taps equals
            it: Pops operands from the internal stack
            and: the operation is defined for those operands
                it: Computes and shows the result in the display
\`\`\`

#### Syntax rules

- **\`describe:\`** — groups related behaviors. Can be nested.
- **\`when:\`** — a condition or user action. Must be inside a \`describe:\`.
- **\`and:\`** — an additional condition that narrows a \`when:\`. Must follow a \`when:\` or another \`and:\`.
- **\`it:\`** — the expected outcome. Every \`when:\` (and \`and:\`) must end with at least one \`it:\`.
- Indentation is 4 spaces per level. No tabs.
- Labels are plain English — concise but descriptive.

### Instructions

1. Create or modify \`.vex\` files to cover **every** behavior, edge case, and error path from the requirements.
2. Organize specs logically — one top-level \`describe:\` per major feature area.
3. Be thorough. Every user-facing flow, validation rule, and error state should have a \`when:\`/\`it:\` pair.
4. Place spec files in a sensible location (project root or a \`specs/\` directory).

### Constraints

- **You may ONLY write \`.vex\` files.** All other file writes, deletes, and shell commands will be blocked.
- Do not write any implementation code, tests, or configuration — only \`.vex\` specs.

### Advancing to the Next Step

When you have finished writing all spec files and are confident every requirement is covered, write the file \`.vex-advance\` with the single word \`approve\` as its content. The system will intercept this write, advance the workflow to the **Approve** step, and you must then **stop immediately** — do not take any further actions after advancing.
`;
}
function approveStepRule() {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Approve Step (Step 3 of 6)

You are operating inside the **Vex workflow**. The current step is **Approve**.

### STOP

The spec phase is complete. **Do not take any actions.** Do not write, modify, or delete any files. Do not run commands.

The user is reviewing the \`.vex\` spec files you wrote. Wait for them to either:

- **Approve** — they will advance the workflow to the Build step.
- **Request changes** — they will ask you to revise specific specs, at which point the workflow will return to the Spec step.

You have **no write access** during this step. Simply acknowledge that specs are ready for review and wait.
`;
}
function buildStepRule() {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Build Step (Step 4 of 6)

You are operating inside the **Vex workflow**. The current step is **Build**.

_Build step instructions are not yet implemented._
`;
}
function verifyStepRule() {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Verify Step (Step 5 of 6)

You are operating inside the **Vex workflow**. The current step is **Verify**.

_Verify step instructions are not yet implemented._
`;
}
function doneStepRule() {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Done (Step 6 of 6)

You are operating inside the **Vex workflow**. The current step is **Done**.

The workflow is complete. No further actions are needed.
`;
}

// src/workflow-sync.ts
function syncWorkflowToFiles(params) {
  if (!params.enabled) {
    cleanupWorkflowFiles(params.workspaceRoot);
    return;
  }
  writeWorkflowState(params.workspaceRoot, {
    activeId: params.activeId,
    enabled: true,
    step: params.step
  });
  writeWorkflowRule(params.workspaceRoot, params.step, params.lintErrors);
  installHooks(params.workspaceRoot);
}
function cleanupWorkflowFiles(workspaceRoot) {
  deleteWorkflowState(workspaceRoot);
  deleteWorkflowRule(workspaceRoot);
  uninstallHooks(workspaceRoot);
}

// src/extension.ts
var VIEW_ID = "vex.panel.stepper";
var VEX_TREE_VIEW_TYPE = "vex.tree";
var POLL_MS = 2000;
var STATE_KEY_STEPS = "vex.stepByTabId";
var STATE_KEY_ENABLED = "vex.workflowEnabled";
function getWorkspaceRoot() {
  const folders = vscode5.workspace.workspaceFolders;
  if (folders == null || folders.length === 0) {
    return "";
  }
  return folders[0].uri.fsPath;
}
function resolveStep(activeId, steps) {
  if (activeId === null) {
    return 0;
  }
  return steps[activeId] ?? 0;
}
async function openVexTreeEditorForActiveFile() {
  const doc = vscode5.window.activeTextEditor?.document;
  if (doc == null) {
    await vscode5.window.showInformationMessage("Open a .vex file first.");
    return;
  }
  if (doc.languageId !== "vex" && !doc.uri.fsPath.toLowerCase().endsWith(".vex")) {
    await vscode5.window.showInformationMessage("Open a .vex file first.");
    return;
  }
  await vscode5.commands.executeCommand("vscode.openWith", doc.uri, VEX_TREE_VIEW_TYPE, {
    viewColumn: vscode5.ViewColumn.Active
  });
}
function composerStateChanged(prev, next) {
  if (prev == null) {
    return true;
  }
  if (prev.activeId !== next.activeId) {
    return true;
  }
  if (prev.tabs.length !== next.tabs.length) {
    return true;
  }
  for (let i = 0;i < prev.tabs.length; i++) {
    if (prev.tabs[i].composerId !== next.tabs[i].composerId) {
      return true;
    }
    if (prev.tabs[i].name !== next.tabs[i].name) {
      return true;
    }
  }
  return false;
}
function activate(context) {
  const root = getWorkspaceRoot();
  context.subscriptions.push(vscode5.window.registerCustomEditorProvider(VEX_TREE_VIEW_TYPE, createVexTreeEditorProvider(context), {
    supportsMultipleEditorsPerDocument: false,
    webviewOptions: { retainContextWhenHidden: false }
  }));
  context.subscriptions.push(vscode5.commands.registerCommand("vex.panel.openEditorVisual", () => openVexTreeEditorForActiveFile()));
  let stepByTabId = context.globalState.get(STATE_KEY_STEPS) ?? {};
  let workflowEnabled = context.globalState.get(STATE_KEY_ENABLED) ?? true;
  let activeId = null;
  let activeWebviewView;
  let lastComposerState = null;
  let pollTimer;
  let ignoreNextFileChange = false;
  function syncFiles(lintErrors) {
    if (root.length === 0) {
      return;
    }
    ignoreNextFileChange = true;
    syncWorkflowToFiles({
      activeId,
      enabled: workflowEnabled,
      lintErrors,
      step: resolveStep(activeId, stepByTabId),
      workspaceRoot: root
    });
  }
  function persistState() {
    context.globalState.update(STATE_KEY_STEPS, stepByTabId);
    context.globalState.update(STATE_KEY_ENABLED, workflowEnabled);
  }
  function sendWorkflowConfig(view) {
    view.webview.postMessage({ enabled: workflowEnabled, stepByTabId, type: "workflowConfig" });
  }
  function sendComposerState(view, state) {
    view.webview.postMessage({ activeId: state.activeId, tabs: state.tabs, type: "composerState" });
  }
  async function poll() {
    if (activeWebviewView == null) {
      return;
    }
    let state;
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
  function startPolling() {
    if (pollTimer != null) {
      return;
    }
    poll();
    pollTimer = setInterval(() => void poll(), POLL_MS);
  }
  function stopPolling() {
    if (pollTimer != null) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  }
  function handleWebviewMessage(message) {
    const type = message["type"];
    if (type === "openEditorVisual") {
      openVexTreeEditorForActiveFile();
      return;
    }
    if (type === "requestState") {
      poll();
      if (activeWebviewView != null) {
        sendWorkflowConfig(activeWebviewView);
      }
      return;
    }
    if (type === "refreshWindow") {
      vscode5.commands.executeCommand("workbench.action.reloadWindow");
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
  async function handleExternalStepChange(fileState) {
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
        vscode5.window.showWarningMessage(`Vex lint: ${String(lint.errors.length)} error(s) found. Agent returned to Spec step.`);
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
    const watcher = vscode5.workspace.createFileSystemWatcher(new vscode5.RelativePattern(root, ".vex-workflow"));
    watcher.onDidChange(() => {
      if (ignoreNextFileChange) {
        ignoreNextFileChange = false;
        return;
      }
      const fileState = readWorkflowState(root);
      if (!fileState.enabled) {
        return;
      }
      handleExternalStepChange(fileState);
    });
    context.subscriptions.push(watcher);
  }
  syncFiles();
  const provider = {
    resolveWebviewView(webviewView) {
      activeWebviewView = webviewView;
      webviewView.webview.options = { enableScripts: true };
      webviewView.webview.html = buildStepperHtml();
      webviewView.webview.onDidReceiveMessage((msg) => {
        if (typeof msg === "object" && msg !== null) {
          handleWebviewMessage(msg);
        }
      });
      webviewView.onDidDispose(() => {
        if (activeWebviewView === webviewView) {
          activeWebviewView = undefined;
          stopPolling();
        }
      });
      startPolling();
    }
  };
  context.subscriptions.push(vscode5.window.registerWebviewViewProvider(VIEW_ID, provider));
  context.subscriptions.push({ dispose: stopPolling });
  context.subscriptions.push({
    dispose: () => {
      if (root.length > 0) {
        cleanupWorkflowFiles(root);
      }
    }
  });
}
function deactivate() {}

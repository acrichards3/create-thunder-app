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
var vscode4 = __toESM(require("vscode"));

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
    }
    .vex-spec-toggle {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
    }
    .vex-spec-toggle-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--vex-purple-300);
      white-space: nowrap;
    }
    .vex-spec-toggle-track {
      position: relative;
      width: 38px;
      height: 20px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(167, 139, 250, 0.35);
      flex-shrink: 0;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .vex-spec-toggle-track:has(.vex-spec-toggle-input:checked) {
      background: rgba(124, 58, 237, 0.45);
      border-color: rgba(196, 181, 253, 0.55);
    }
    .vex-spec-toggle-input {
      opacity: 0;
      position: absolute;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
    }
    .vex-spec-toggle-knob {
      position: absolute;
      top: 50%;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: var(--vscode-foreground);
      opacity: 0.45;
      transform: translate(0, -50%);
      transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
      pointer-events: none;
    }
    .vex-spec-toggle-input:checked + .vex-spec-toggle-knob {
      transform: translate(18px, -50%);
      background: #c4b5fd;
      opacity: 1;
    }
    .vex-spec-toggle-input:focus-visible + .vex-spec-toggle-knob {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
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
`;

// src/stepper-html.ts
var STEPS = [
  { label: "Describe" },
  { label: "Spec" },
  { label: "Approve" },
  { label: "Build" },
  { label: "Verify" },
  { label: "Done" }
];
function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function escapeAttr(text) {
  return escapeHtml(text).replaceAll(`
`, " ");
}
function buildStepperHtml() {
  const segments = [];
  STEPS.forEach((step, index) => {
    const n = index + 1;
    const isActive = index === 0;
    const nodeClass = isActive ? "vex-node vex-node--active" : "vex-node vex-node--pending";
    const ariaCurrent = isActive ? ' aria-current="step"' : "";
    segments.push(`<div class="vex-step-outer" role="listitem">
    <button type="button" class="vex-step"${ariaCurrent} data-step-index="${String(index)}" title="${escapeAttr(step.label)}">
    <span class="vex-node-wrap">
    <span class="${nodeClass}">
      <span class="vex-node-num">${String(n)}</span>
    </span>
    </span>
    <span class="vex-label">${escapeHtml(step.label)}</span>
    </button>
  </div>`);
    if (index < STEPS.length - 1) {
      segments.push(`<div class="vex-connector" aria-hidden="true"><span class="vex-connector-line"></span></div>`);
    }
  });
  const trackInner = segments.join(`
`);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vex</title>
  <style>${VEX_STEPPER_INLINE_CSS}
  </style>
</head>
<body>
  <div class="vex-shell">
    <div class="vex-shell-header">
      <p class="vex-title">Progress</p>
      <div class="vex-shell-header-right">
        <label class="vex-spec-toggle">
          <span class="vex-spec-toggle-label">Enable spec-first workflow</span>
          <span class="vex-spec-toggle-track">
            <input class="vex-spec-toggle-input" type="checkbox" role="switch" checked />
            <span class="vex-spec-toggle-knob"></span>
          </span>
        </label>
        <button type="button" class="vex-open-visual" id="vex-open-visual">Open tree view</button>
      </div>
    </div>
    <div class="vex-track" role="list" aria-label="Vex workflow steps">
${trackInner}
    </div>
  </div>
  <script>
    (function () {
      const vscodeApi = acquireVsCodeApi();
      const openBtn = document.getElementById("vex-open-visual");
      if (openBtn) {
        openBtn.addEventListener("click", function () {
          vscodeApi.postMessage({ type: "openEditorVisual" });
        });
      }
      const buttons = Array.from(document.querySelectorAll("button.vex-step"));
      function setActive(index) {
        buttons.forEach(function (btn, i) {
          const node = btn.querySelector(".vex-node");
          if (!node) {
            return;
          }
          if (i === index) {
            node.classList.remove("vex-node--pending");
            node.classList.add("vex-node--active");
            btn.setAttribute("aria-current", "step");
          } else {
            node.classList.remove("vex-node--active");
            node.classList.add("vex-node--pending");
            btn.removeAttribute("aria-current");
          }
        });
      }
      buttons.forEach(function (btn, index) {
        btn.addEventListener("click", function () {
          setActive(index);
        });
      });
    })();
  </script>
</body>
</html>`;
}

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
function parseDescribeLabelSpanInContent(content) {
  const trimmed = content.trimStart();
  const m = /^describe\s*:\s*/iu.exec(trimmed);
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
function parseListLabelSpanInContent(content) {
  const trimmed = content.trimStart();
  const m = /^(when|and|it)\s*:\s*/iu.exec(trimmed);
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
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
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
    }
  };
}

// src/extension.ts
var VIEW_ID = "vex.panel.stepper";
var VEX_TREE_VIEW_TYPE = "vex.tree";
async function openVexTreeEditorForActiveFile() {
  const doc = vscode4.window.activeTextEditor?.document;
  if (doc == null) {
    await vscode4.window.showInformationMessage("Open a .vex file first.");
    return;
  }
  const fsPath = doc.uri.fsPath.toLowerCase();
  const isVex = doc.languageId === "vex" ? true : fsPath.endsWith(".vex");
  if (!isVex) {
    await vscode4.window.showInformationMessage("Open a .vex file first.");
    return;
  }
  await vscode4.commands.executeCommand("vscode.openWith", doc.uri, VEX_TREE_VIEW_TYPE, {
    viewColumn: vscode4.ViewColumn.Active
  });
}
function activate(context) {
  const vexTreeProvider = createVexTreeEditorProvider(context);
  context.subscriptions.push(vscode4.window.registerCustomEditorProvider(VEX_TREE_VIEW_TYPE, vexTreeProvider, {
    supportsMultipleEditorsPerDocument: false,
    webviewOptions: {
      retainContextWhenHidden: false
    }
  }));
  context.subscriptions.push(vscode4.commands.registerCommand("vex.panel.openEditorVisual", () => {
    return openVexTreeEditorForActiveFile();
  }));
  const provider = {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: true
      };
      webviewView.webview.html = buildStepperHtml();
      webviewView.webview.onDidReceiveMessage((message) => {
        if (message.type === "openEditorVisual") {
          openVexTreeEditorForActiveFile();
        }
      });
    }
  };
  context.subscriptions.push(vscode4.window.registerWebviewViewProvider(VIEW_ID, provider));
}
function deactivate() {}

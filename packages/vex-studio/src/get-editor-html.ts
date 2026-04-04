import type { Uri, Webview } from "vscode";

export function getEditorVisualHtml(webview: Webview, scriptUri: Uri): string {
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src ${webview.cspSource}`,
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

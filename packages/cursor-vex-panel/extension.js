const vscode = require("vscode");

const VIEW_ID = "vex.panel.stepper";

const STEPS = [
  { label: "Describe" },
  { label: "Spec" },
  { label: "Approve" },
  { label: "Build" },
  { label: "Verify" },
  { label: "Done" },
];

function buildStepperHtml() {
  const segments = [];
  STEPS.forEach((step, index) => {
    const n = index + 1;
    segments.push(`<div class="vex-step" role="listitem">
    <div class="vex-node vex-node--pending" title="${escapeAttr(step.label)}">
      <span class="vex-node-num">${String(n)}</span>
    </div>
    <span class="vex-label">${escapeHtml(step.label)}</span>
  </div>`);
    if (index < STEPS.length - 1) {
      segments.push(`<div class="vex-connector" aria-hidden="true"><span class="vex-connector-line"></span></div>`);
    }
  });
  const trackInner = segments.join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vex</title>
  <style>
    :root {
      --vex-purple-300: #c4b5fd;
      --vex-surface: rgba(88, 28, 135, 0.22);
    }
    body {
      margin: 0;
      padding: 16px 20px 20px;
      font-family: var(--vscode-font-family), system-ui, sans-serif;
      font-size: 13px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
    }
    .vex-shell {
      border-radius: 12px;
      padding: 18px 20px 22px;
      background: linear-gradient(145deg, var(--vex-surface), rgba(15, 23, 42, 0.35));
      border: 1px solid rgba(167, 139, 250, 0.28);
      box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.12), 0 12px 40px rgba(15, 23, 42, 0.45);
    }
    .vex-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--vex-purple-300);
      margin: 0 0 14px;
    }
    .vex-track {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .vex-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
    }
    .vex-node {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      box-sizing: border-box;
      transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }
    .vex-node--pending {
      color: var(--vex-purple-300);
      background: radial-gradient(circle at 30% 25%, rgba(192, 132, 252, 0.35), rgba(76, 29, 149, 0.65));
      border: 1px solid rgba(196, 181, 253, 0.55);
      box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.35), 0 4px 14px rgba(76, 29, 149, 0.45);
    }
    .vex-node-num {
      line-height: 1;
    }
    .vex-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--vex-purple-300);
      text-align: center;
      max-width: 88px;
      line-height: 1.25;
    }
    .vex-connector {
      flex: 1 1 0;
      min-width: 12px;
      height: 36px;
      display: flex;
      align-items: center;
      align-self: flex-start;
      padding-left: 4px;
      padding-right: 4px;
    }
    .vex-connector-line {
      display: block;
      width: 100%;
      height: 3px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.85), rgba(167, 139, 250, 0.15));
      opacity: 0.85;
    }
  </style>
</head>
<body>
  <div class="vex-shell">
    <p class="vex-title">Progress</p>
    <div class="vex-track" role="list" aria-label="Vex workflow steps">
${trackInner}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(text) {
  return escapeHtml(text).replaceAll("\n", " ");
}

function activate(context) {
  const provider = {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: false,
      };
      webviewView.webview.html = buildStepperHtml();
    },
  };

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(VIEW_ID, provider));
}

function deactivate() {}

module.exports = { activate, deactivate };

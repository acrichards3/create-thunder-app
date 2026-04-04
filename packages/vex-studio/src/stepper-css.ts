export const VEX_STEPPER_INLINE_CSS = `
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

import { VEX_STEPPER_INLINE_CSS } from "./stepper-css";

export function buildStepperHtml(): string {
  return (
    '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8" />' +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';\" />" +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    "<title>Vex</title>" +
    "<style>" +
    VEX_STEPPER_INLINE_CSS +
    "</style></head><body>" +
    '<div class="vex-shell">' +
    '<div class="vex-shell-header">' +
    '<p class="vex-title" id="vex-agent-name">Agent Workflows</p>' +
    '<div class="vex-shell-header-right">' +
    '<button type="button" class="vex-open-visual" id="vex-open-visual">Open tree view</button>' +
    "</div></div>" +
    '<div id="vex-stepper-area">' +
    '<p class="vex-no-agents">Waiting for agent data...</p>' +
    "</div></div>" +
    "<script>" +
    INLINE_SCRIPT +
    "</script></body></html>"
  );
}

const INLINE_SCRIPT = [
  "(function () {",
  "  var vscodeApi = acquireVsCodeApi();",
  "  var STEP_COUNT = 6;",
  "  var activeId = null;",
  "  var activeName = '';",
  "  var stepByTabId = {};",
  "",
  "  var saved = vscodeApi.getState();",
  "  if (saved && saved.stepByTabId) { stepByTabId = saved.stepByTabId; }",
  "",
  "  function saveState() { vscodeApi.setState({ stepByTabId: stepByTabId }); }",
  "",
  "  function getStepForTab(tabId) {",
  "    if (stepByTabId[tabId] != null) return stepByTabId[tabId];",
  "    return 0;",
  "  }",
  "",
  "  function buildTrackHtml(activeStep) {",
  '    var labels = ["Describe","Spec","Approve","Build","Verify","Done"];',
  '    var out = "";',
  "    for (var i = 0; i < labels.length; i++) {",
  '      var cls = i === activeStep ? "vex-node vex-node--active" : "vex-node vex-node--pending";',
  '      var aria = i === activeStep ? \' aria-current="step"\' : "";',
  '      out += \'<div class="vex-step-outer" role="listitem">\'',
  "        + '<button type=\"button\" class=\"vex-step\"' + aria + ' data-step-index=\"' + i + '\" title=\"' + labels[i] + '\">'",
  '        + \'<span class="vex-node-wrap"><span class="\' + cls + \'"><span class="vex-node-num">\' + (i+1) + "</span></span></span>"',
  '        + \'<span class="vex-label">\' + labels[i] + "</span></button></div>";',
  "      if (i < labels.length - 1) {",
  '        out += \'<div class="vex-connector" aria-hidden="true"><span class="vex-connector-line"></span></div>\';',
  "      }",
  "    }",
  "    return out;",
  "  }",
  "",
  "  function renderHeader() {",
  '    var el = document.getElementById("vex-agent-name");',
  "    if (!el) return;",
  "    if (activeName && activeName.length > 0) {",
  "      el.textContent = activeName;",
  "    } else {",
  '      el.textContent = "Agent Workflows";',
  "    }",
  "  }",
  "",
  "  function renderStepper() {",
  '    var area = document.getElementById("vex-stepper-area");',
  "    if (!area) return;",
  "    if (!activeId) {",
  "      area.innerHTML = '<p class=\"vex-no-agents\">No agent tabs open</p>';",
  "      return;",
  "    }",
  "    var step = getStepForTab(activeId);",
  '    area.innerHTML = \'<div class="vex-track" role="list" aria-label="Workflow steps">\' + buildTrackHtml(step) + "</div>";',
  "  }",
  "",
  "  function render() { renderHeader(); renderStepper(); }",
  "",
  "  window.addEventListener('message', function (e) {",
  "    var msg = e.data;",
  "    if (!msg) return;",
  "    if (msg.type === 'composerTabsUpdated') {",
  "      var newId = msg.activeId;",
  "      if (newId && newId !== activeId) {",
  "        activeId = newId;",
  "        activeName = '';",
  "        var tabs = msg.tabs || [];",
  "        for (var i = 0; i < tabs.length; i++) {",
  "          if (tabs[i].composerId === newId) {",
  "            activeName = tabs[i].name || '';",
  "            break;",
  "          }",
  "        }",
  "        render();",
  "      } else if (!activeId && msg.tabs && msg.tabs.length > 0) {",
  "        activeId = msg.tabs[0].composerId;",
  "        activeName = msg.tabs[0].name || '';",
  "        render();",
  "      }",
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
  "        renderStepper();",
  "      }",
  "      return;",
  "    }",
  "",
  "    var openBtn = e.target.closest('#vex-open-visual');",
  "    if (openBtn) {",
  '      vscodeApi.postMessage({ type: "openEditorVisual" });',
  "      return;",
  "    }",
  "  });",
  "",
  "  render();",
  '  vscodeApi.postMessage({ type: "requestComposerState" });',
  "})();",
].join("\n");

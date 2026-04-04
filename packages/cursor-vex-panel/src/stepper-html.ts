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
    '<button type="button" class="vex-open-visual" id="vex-refresh" title="Refresh active agent">&#x21bb;</button>' +
    '<button type="button" class="vex-open-visual" id="vex-open-visual">Open tree view</button>' +
    "</div></div>" +
    '<div id="vex-stepper-area"></div>' +
    "</div>" +
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
  "  function render() {",
  '    var title = document.getElementById("vex-agent-name");',
  "    if (title) {",
  "      title.textContent = (activeName && activeName.length > 0) ? activeName : 'Agent Workflows';",
  "    }",
  '    var area = document.getElementById("vex-stepper-area");',
  "    if (area) {",
  '      area.innerHTML = \'<div class="vex-track" role="list" aria-label="Workflow steps">\' + buildTrackHtml(getStep()) + "</div>";',
  "    }",
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
  "        render();",
  "      }",
  "      return;",
  "    }",
  "    var refreshBtn = e.target.closest('#vex-refresh');",
  "    if (refreshBtn) {",
  '      vscodeApi.postMessage({ type: "refreshWindow" });',
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
  '  vscodeApi.postMessage({ type: "requestState" });',
  "})();",
].join("\n");

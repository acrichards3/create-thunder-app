import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.6/+esm";
import { finalizeAssistantVisibleText } from "./strip-assistant-visible-text.js?v=5";

const ASSISTANT_WIDTH_MIN = 260;
const ASSISTANT_WIDTH_MAX = 560;

marked.setOptions({
  breaks: true,
  gfm: true,
});

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node instanceof Element) {
    node.setAttribute("rel", "noopener noreferrer");
    node.setAttribute("target", "_blank");
  }
});

const ASSISTANT_MD_PURIFY = {
  ADD_ATTR: ["class"],
  ADD_TAGS: ["div"],
};

function wrapAssistantQuestionsSectionHtml(html) {
  const re = /<h2[^>]*>\s*(?:Questions for you|Questions)\s*<\/h2>/i;
  const m = re.exec(html);
  if (m == null || m.index === undefined) {
    return html;
  }
  const start = m.index;
  return `${html.slice(0, start)}<div class="assistant-questions">${html.slice(start)}</div>`;
}

function parseNdjsonErrorMessage(errText) {
  const first = errText.trim().split("\n")[0] ?? "";
  if (first.length === 0) {
    return "";
  }
  try {
    const ev = JSON.parse(first);
    if (ev && typeof ev.type === "string" && ev.type === "error" && typeof ev.message === "string") {
      return ev.message;
    }
  } catch {
    return "";
  }
  return "";
}

function assistantMarkdownToSafeHtml(markdown) {
  const withoutMarker = finalizeAssistantVisibleText(markdown);
  const raw = marked.parse(withoutMarker);
  const html = typeof raw === "string" ? raw : "";
  const wrapped = wrapAssistantQuestionsSectionHtml(html);
  return DOMPurify.sanitize(wrapped, ASSISTANT_MD_PURIFY);
}

function fillAssistantMessageBody(bodyEl, content, useMarkdown) {
  bodyEl.classList.remove("assistant-msg-body--md");
  if (useMarkdown) {
    bodyEl.classList.add("assistant-msg-body--md");
    bodyEl.innerHTML = assistantMarkdownToSafeHtml(content);
    return;
  }
  bodyEl.textContent = content;
}

function clampAssistantWidthPx(w) {
  return Math.min(ASSISTANT_WIDTH_MAX, Math.max(ASSISTANT_WIDTH_MIN, Math.round(w)));
}

function setAssistantWidthCss(px) {
  document.documentElement.style.setProperty("--assistant-width", `${String(px)}px`);
}

function applyAssistantWidthFromState(state) {
  if (typeof state.assistantWidthPx !== "number" || !Number.isFinite(state.assistantWidthPx)) {
    return;
  }
  const w = clampAssistantWidthPx(state.assistantWidthPx);
  state.assistantWidthPx = w;
  setAssistantWidthCss(w);
}

function syncAssistantPanel(state) {
  const layout = document.getElementById("layout");
  const btn = document.getElementById("toggle-assistant");
  const collapsed = state.assistantCollapsed;
  layout.classList.toggle("assistant-panel-collapsed", collapsed);
  btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  btn.textContent = collapsed ? "⟪" : "⟫";
  btn.setAttribute("title", collapsed ? "Show assistant (Ctrl+Shift+L)" : "Hide assistant (Ctrl+Shift+L)");
  btn.setAttribute("aria-label", collapsed ? "Show assistant" : "Hide assistant");
}

function toggleAssistantPanel(state, saveDashboardView) {
  state.assistantCollapsed = !state.assistantCollapsed;
  syncAssistantPanel(state);
  saveDashboardView();
}

function onAssistantHotkey(e, state, saveDashboardView) {
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) {
    return;
  }
  if (e.key !== "l" && e.key !== "L") {
    return;
  }
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
    return;
  }
  e.preventDefault();
  toggleAssistantPanel(state, saveDashboardView);
}

function wireAssistantResize(state, saveDashboardView) {
  const handle = document.getElementById("assistant-resize-handle");
  const layout = document.getElementById("layout");
  const shell = document.getElementById("assistant-shell");
  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  function shellWidthNow() {
    return shell.getBoundingClientRect().width;
  }

  function onPointerDown(e) {
    if (state.assistantCollapsed) {
      return;
    }
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = shellWidthNow();
    layout.classList.add("assistant-shell-resizing");
    document.body.classList.add("assistant-resize-active");
    handle.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) {
      return;
    }
    const delta = e.clientX - startX;
    const w = clampAssistantWidthPx(startWidth - delta);
    setAssistantWidthCss(w);
  }

  function onPointerUp(e) {
    if (!dragging) {
      return;
    }
    dragging = false;
    layout.classList.remove("assistant-shell-resizing");
    document.body.classList.remove("assistant-resize-active");
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may not be held */
    }
    state.assistantWidthPx = clampAssistantWidthPx(shellWidthNow());
    setAssistantWidthCss(state.assistantWidthPx);
    saveDashboardView();
  }

  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);
  handle.addEventListener("pointercancel", onPointerUp);
}

function renderChatMessages(container, messages) {
  container.replaceChildren();
  messages.forEach((m, i) => {
    const row = document.createElement("div");
    const isErr = m.error === true;
    row.className = `assistant-msg assistant-msg-${m.role}`;
    if (isErr) {
      row.classList.add("assistant-msg--error");
    }
    row.dataset.index = String(i);
    const label = document.createElement("div");
    label.className = "assistant-msg-label";
    if (m.role === "user") {
      label.textContent = "You";
    } else if (isErr) {
      label.textContent = "Error";
    } else {
      label.textContent = "Assistant";
    }
    const body = document.createElement("div");
    body.className = "assistant-msg-body";
    fillAssistantMessageBody(body, m.content, m.role === "assistant");
    row.append(label, body);
    container.append(row);
  });
  container.scrollTop = container.scrollHeight;
}

export function initAssistantPanel(input) {
  const { saveDashboardView, state } = input;
  const messages = [];
  const listEl = document.getElementById("assistant-messages");
  const form = document.getElementById("assistant-form");
  const inputEl = document.getElementById("assistant-input");
  const statusEl = document.getElementById("assistant-status");

  applyAssistantWidthFromState(state);
  syncAssistantPanel(state);

  let thinkingTimer = null;

  function clearThinkingAnimation() {
    if (thinkingTimer != null) {
      window.clearInterval(thinkingTimer);
      thinkingTimer = null;
    }
    statusEl.classList.remove("assistant-status--thinking");
    statusEl.removeAttribute("aria-busy");
  }

  function setStatus(text) {
    clearThinkingAnimation();
    statusEl.classList.remove("assistant-status--error");
    statusEl.textContent = text;
  }

  function setStatusError(text) {
    clearThinkingAnimation();
    statusEl.classList.remove("assistant-status--thinking");
    statusEl.classList.add("assistant-status--error");
    statusEl.removeAttribute("aria-busy");
    statusEl.textContent = text;
  }

  function setThinking() {
    if (thinkingTimer != null) {
      window.clearInterval(thinkingTimer);
      thinkingTimer = null;
    }
    statusEl.classList.remove("assistant-status--error");
    statusEl.classList.add("assistant-status--thinking");
    statusEl.setAttribute("aria-busy", "true");
    let phase = 0;
    const suffixes = ["", ".", "..", "..."];
    function tick() {
      statusEl.textContent = `Thinking${suffixes[phase]}`;
      phase = (phase + 1) % suffixes.length;
    }
    tick();
    thinkingTimer = window.setInterval(tick, 420);
  }

  let cachedStatusLine = "";

  function restoreIdleStatus() {
    setStatus(cachedStatusLine.length > 0 ? cachedStatusLine : "Cursor agent");
  }

  async function refreshStatus() {
    try {
      const res = await fetch("/api/assistant/status");
      if (!res.ok) {
        setStatusError("Status unavailable.");
        return;
      }
      const data = await res.json();
      const parts = [];
      if (data.cursorConfigured) {
        parts.push("Cursor agent ready");
      } else {
        parts.push("Set VEXKIT_USE_CURSOR_AGENT=1 + CURSOR_API_KEY");
      }
      if (data.mcpConfigured) {
        parts.push("MCP configured");
      }
      cachedStatusLine = parts.join(" · ");
      setStatus(cachedStatusLine);
    } catch {
      setStatusError("Could not load assistant status.");
    }
  }

  function buildPayload() {
    return {
      messages: messages.map((m) => ({ content: m.content, role: m.role })),
    };
  }

  function onSubmit(ev) {
    ev.preventDefault();
    const text = inputEl.value.trim();
    if (text.length === 0) {
      return;
    }
    inputEl.value = "";
    messages.push({ content: text, role: "user" });
    renderChatMessages(listEl, messages);
    void sendChatRequest(buildPayload());
  }

  function onAssistantInputKeydown(e) {
    if (e.key !== "Enter") {
      return;
    }
    if (e.shiftKey) {
      return;
    }
    e.preventDefault();
    form.requestSubmit();
  }

  async function sendChatRequest(payload) {
    let statusErrorShown = false;
    function chatStatusError(msg) {
      statusErrorShown = true;
      setStatusError(msg);
    }

    setThinking();
    messages.push({ content: "", role: "assistant", error: false });
    renderChatMessages(listEl, messages);
    const assistantIdx = messages.length - 1;

    try {
      const res = await fetch("/api/assistant/chat", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        const errText = await res.text();
        const parsedMsg = parseNdjsonErrorMessage(errText);
        const body = parsedMsg.length > 0 ? parsedMsg : `Request failed (${String(res.status)}): ${errText}`;
        messages[assistantIdx].content = body;
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError(parsedMsg.length > 0 ? parsedMsg : `Chat request failed (${String(res.status)}).`);
        return;
      }

      const reader = res.body?.getReader();
      if (reader == null) {
        messages[assistantIdx].content = "Empty response from server (no body).";
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError("Empty response from server.");
        return;
      }

      const dec = new TextDecoder();
      let carry = "";
      let acc = "";
      let sawStreamError = false;
      let sawAssistantOutput = false;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          carry += dec.decode(value, { stream: true });
          const lines = carry.split("\n");
          carry = lines.pop() ?? "";
          lines.forEach((line) => {
            const t = line.trim();
            if (t.length === 0) {
              return;
            }
            let ev;
            try {
              ev = JSON.parse(t);
            } catch {
              return;
            }
            if (ev.type === "delta" && typeof ev.text === "string") {
              if (!sawAssistantOutput) {
                sawAssistantOutput = true;
                restoreIdleStatus();
              }
              acc += ev.text;
              messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
              renderChatMessages(listEl, messages);
            }
            if (ev.type === "error" && typeof ev.message === "string") {
              sawStreamError = true;
              if (!sawAssistantOutput) {
                sawAssistantOutput = true;
                restoreIdleStatus();
              }
              acc += `\n${ev.message}`;
              messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
              messages[assistantIdx].error = true;
              renderChatMessages(listEl, messages);
              chatStatusError("Assistant reported an error.");
            }
          });
        }
      } catch (readErr) {
        sawStreamError = true;
        const detail = readErr instanceof Error ? readErr.message : String(readErr);
        messages[assistantIdx].content = finalizeAssistantVisibleText(
          acc.length > 0 ? `${acc}\n\n(Stream interrupted: ${detail})` : `Stream interrupted: ${detail}`,
        );
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError("Connection to assistant was interrupted.");
      }
      if (!sawAssistantOutput && !sawStreamError && acc.length === 0) {
        messages[assistantIdx].content =
          "No response was received. The server may have closed the stream early (check the terminal running vexkit).";
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError("No assistant output received.");
      }
      if (!sawStreamError && sawAssistantOutput) {
        messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
        renderChatMessages(listEl, messages);
      }
    } finally {
      if (!statusErrorShown) {
        restoreIdleStatus();
      }
    }
  }

  form.addEventListener("submit", onSubmit);
  inputEl.addEventListener("keydown", onAssistantInputKeydown);
  document.getElementById("toggle-assistant").addEventListener("click", () => {
    toggleAssistantPanel(state, saveDashboardView);
  });
  window.addEventListener("keydown", (e) => {
    onAssistantHotkey(e, state, saveDashboardView);
  });
  wireAssistantResize(state, saveDashboardView);
  void refreshStatus();
}

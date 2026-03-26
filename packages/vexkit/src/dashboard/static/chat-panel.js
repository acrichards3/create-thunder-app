import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/+esm";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@15.0.6/+esm";
import { finalizeAssistantVisibleText } from "./strip-assistant-visible-text.js?v=12";

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
  const headingRe = /<h[1-4][^>]*>\s*(?:Questions?\b|Clarif(?:ying|ication)\b|Before (?:we|I)\b)[^<]*<\/h[1-4]>/i;
  const headingMatch = headingRe.exec(html);
  if (headingMatch != null && headingMatch.index !== undefined) {
    return `${html.slice(0, headingMatch.index)}<div class="assistant-questions">${html.slice(headingMatch.index)}</div>`;
  }
  const listRe = /<(?:ul|ol)>[\s\S]*?<\/(?:ul|ol)>/gi;
  let out = html;
  let offset = 0;
  let match;
  while ((match = listRe.exec(html)) != null) {
    const block = match[0];
    const questionCount = (block.match(/\?/g) ?? []).length;
    const itemCount = (block.match(/<li/gi) ?? []).length;
    if (questionCount > 0 && questionCount >= itemCount * 0.5) {
      const pos = match.index + offset;
      const before = out.slice(0, pos);
      const after = out.slice(pos + block.length);
      const wrapped = `<div class="assistant-questions"><h4>Questions</h4>${block}</div>`;
      out = before + wrapped + after;
      offset += wrapped.length - block.length;
    }
  }
  return out;
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
  const scrollEl = document.getElementById("assistant-scroll");
  if (scrollEl != null) {
    scrollEl.scrollTop = scrollEl.scrollHeight;
  }
}

const DEFAULT_ASSISTANT_PLACEHOLDER = "Ask about your spec…";

export function initAssistantPanel(input) {
  const { onSpecChangeRequest, onStartNew, onStepChange, saveDashboardView, state } = input;
  const messages = [];
  const listEl = document.getElementById("assistant-messages");
  const form = document.getElementById("assistant-form");
  const inputEl = document.getElementById("assistant-input");
  const sendBtn = document.getElementById("assistant-send");
  const composerWrapEl = document.getElementById("assistant-composer-wrap");
  const doneWrapEl = document.getElementById("assistant-done-wrap");
  const startNewBtn = document.getElementById("assistant-start-new");
  const statusEl = document.getElementById("assistant-status");
  const activityRowEl = document.getElementById("assistant-activity-row");

  applyAssistantWidthFromState(state);
  syncAssistantPanel(state);

  let thinkingTimer = null;

  function setActivityBusy(isBusy) {
    if (activityRowEl == null) {
      return;
    }
    activityRowEl.classList.toggle("assistant-activity-row--busy", isBusy);
    activityRowEl.setAttribute("aria-busy", isBusy ? "true" : "false");
  }

  function clearThinkingAnimation() {
    if (thinkingTimer != null) {
      window.clearInterval(thinkingTimer);
      thinkingTimer = null;
    }
    statusEl.classList.remove("assistant-status--thinking");
  }

  function setStatus(text) {
    clearThinkingAnimation();
    setActivityBusy(false);
    statusEl.classList.remove("assistant-status--error");
    statusEl.textContent = text;
  }

  function setStatusError(text) {
    clearThinkingAnimation();
    setActivityBusy(false);
    statusEl.classList.remove("assistant-status--thinking");
    statusEl.classList.add("assistant-status--error");
    statusEl.textContent = text;
  }

  function setWorkingLine(text) {
    clearThinkingAnimation();
    setActivityBusy(true);
    statusEl.classList.remove("assistant-status--error");
    statusEl.classList.remove("assistant-status--thinking");
    statusEl.textContent = text;
  }

  function setThinking() {
    if (thinkingTimer != null) {
      window.clearInterval(thinkingTimer);
      thinkingTimer = null;
    }
    setActivityBusy(true);
    statusEl.classList.remove("assistant-status--error");
    statusEl.classList.add("assistant-status--thinking");
    let phase = 0;
    const suffixes = ["", ".", "..", "..."];
    function tick() {
      statusEl.textContent = `Agent working${suffixes[phase]}`;
      phase = (phase + 1) % suffixes.length;
    }
    tick();
    thinkingTimer = window.setInterval(tick, 420);
  }

  let cachedStatusLine = "";

  function restoreIdleStatus() {
    clearThinkingAnimation();
    setActivityBusy(false);
    statusEl.classList.remove("assistant-status--error");
    statusEl.textContent = cachedStatusLine.length > 0 ? cachedStatusLine : "Cursor agent ready";
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

  function currentStep() {
    return typeof state.workflowStep === "number" ? state.workflowStep : 0;
  }

  function syncWorkflowComposer() {
    if (composerWrapEl == null || doneWrapEl == null || inputEl == null || sendBtn == null) {
      return;
    }
    const step = currentStep();
    if (step === 5) {
      composerWrapEl.hidden = true;
      doneWrapEl.hidden = false;
      return;
    }
    composerWrapEl.hidden = false;
    doneWrapEl.hidden = true;
    const locked = step === 3 || step === 4;
    inputEl.disabled = locked;
    sendBtn.disabled = locked;
    inputEl.placeholder = locked
      ? step === 3
        ? "Chat disabled during build…"
        : "Chat disabled during verification…"
      : DEFAULT_ASSISTANT_PLACEHOLDER;
  }

  function buildPayload() {
    return {
      messages: messages.map((m) => ({ content: m.content, role: m.role })),
      step: currentStep(),
    };
  }

  function onSubmit(ev) {
    ev.preventDefault();
    if (inputEl.disabled) {
      return;
    }
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
    if (inputEl.disabled) {
      return;
    }
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
      let pendingStepChange = null;
      let pendingSpecChange = null;
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
              }
              acc += ev.text;
              messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
              renderChatMessages(listEl, messages);
            }
            if (ev.type === "error" && typeof ev.message === "string") {
              sawStreamError = true;
              if (!sawAssistantOutput) {
                sawAssistantOutput = true;
              }
              acc += `\n${ev.message}`;
              messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
              messages[assistantIdx].error = true;
              renderChatMessages(listEl, messages);
              chatStatusError("Assistant reported an error.");
            }
            if (ev.type === "step_change" && typeof ev.step === "number") {
              console.log("[vexkit-chat] received step_change event:", ev.step);
              pendingStepChange = ev.step;
            }
            if (ev.type === "spec_change_request" && typeof ev.reason === "string") {
              console.log("[vexkit-chat] received spec_change_request:", ev.reason);
              pendingSpecChange = ev.reason;
            }
            if (ev.type === "done") {
              console.log(
                "[vexkit-chat] received done event, pendingStepChange:",
                pendingStepChange,
                "pendingSpecChange:",
                pendingSpecChange,
              );
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
      console.log(
        "[vexkit-chat] stream finished — pendingStepChange:",
        pendingStepChange,
        "pendingSpecChange:",
        pendingSpecChange,
        "onStepChange:",
        typeof onStepChange,
        "onSpecChangeRequest:",
        typeof onSpecChangeRequest,
      );
      if (pendingSpecChange != null && typeof onSpecChangeRequest === "function") {
        console.log("[vexkit-chat] calling onSpecChangeRequest");
        onSpecChangeRequest(pendingSpecChange);
      } else if (pendingStepChange != null && typeof onStepChange === "function") {
        console.log("[vexkit-chat] calling onStepChange with step:", pendingStepChange);
        onStepChange(pendingStepChange);
      } else {
        console.log("[vexkit-chat] NO transition triggered");
      }
    } finally {
      if (!statusErrorShown) {
        restoreIdleStatus();
      }
    }
  }

  function autoPrompt(text) {
    const msg = typeof text === "string" && text.length > 0 ? text : "Proceed.";
    const payload = buildPayload();
    console.log("[vexkit-chat] autoPrompt firing — step:", payload.step, "msg:", msg);
    messages.push({ content: msg, role: "user" });
    renderChatMessages(listEl, messages);
    payload.messages = messages.map((m) => ({ content: m.content, role: m.role }));
    void sendChatRequest(payload);
  }

  function triggerVerify() {
    setWorkingLine("Running verification (lint, format, typecheck)…");
    console.log("[vexkit-chat] triggerVerify called");
    messages.push({ content: "Running verification (lint, typecheck, format)...", role: "assistant", error: false });
    renderChatMessages(listEl, messages);
    fetch("/api/workflow/verify", { method: "POST" })
      .then((res) => {
        console.log("[vexkit-chat] verify response status:", res.status);
        return res.json();
      })
      .then((data) => {
        restoreIdleStatus();
        console.log("[vexkit-chat] verify result ok:", data.ok);
        if (data.ok === true) {
          messages.push({ content: "All checks passed!", role: "assistant", error: false });
          renderChatMessages(listEl, messages);
          if (typeof onStepChange === "function") {
            onStepChange(5);
          }
        } else {
          const rawLog = typeof data.log === "string" ? data.log : "Verification failed.";
          const errorCtx = rawLog.length > 3000 ? `${rawLog.slice(0, 3000)}\n\n... (truncated)` : rawLog;
          messages.push({
            content: `Verification failed. Sending errors to model to fix.\n\n\`\`\`\n${errorCtx.slice(0, 1000)}\n\`\`\``,
            role: "assistant",
            error: true,
          });
          renderChatMessages(listEl, messages);
          if (typeof onStepChange === "function") {
            onStepChange(3);
          }
          setTimeout(() => {
            autoPrompt(`Verification failed. Fix the issues and try again.\n\n${errorCtx}`);
          }, 200);
        }
      })
      .catch((catchErr) => {
        console.error("[vexkit-chat] verify fetch error:", catchErr);
        restoreIdleStatus();
        messages.push({
          content: `Verify request failed: ${catchErr instanceof Error ? catchErr.message : String(catchErr)}`,
          role: "assistant",
          error: true,
        });
        renderChatMessages(listEl, messages);
        setStatusError("Verify request failed.");
      });
  }

  form.addEventListener("submit", onSubmit);
  inputEl.addEventListener("keydown", onAssistantInputKeydown);
  document.getElementById("toggle-assistant").addEventListener("click", () => {
    toggleAssistantPanel(state, saveDashboardView);
  });
  window.addEventListener("keydown", (e) => {
    onAssistantHotkey(e, state, saveDashboardView);
  });
  if (startNewBtn != null && typeof onStartNew === "function") {
    startNewBtn.addEventListener("click", () => {
      onStartNew();
    });
  }
  wireAssistantResize(state, saveDashboardView);
  void refreshStatus();
  syncWorkflowComposer();

  return { autoPrompt, syncWorkflowComposer, triggerVerify };
}

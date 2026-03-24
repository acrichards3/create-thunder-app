const ASSISTANT_WIDTH_MIN = 260;
const ASSISTANT_WIDTH_MAX = 560;

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
    row.className = `assistant-msg assistant-msg-${m.role}`;
    row.dataset.index = String(i);
    const label = document.createElement("div");
    label.className = "assistant-msg-label";
    label.textContent = m.role === "user" ? "You" : "Assistant";
    const body = document.createElement("div");
    body.className = "assistant-msg-body";
    body.textContent = m.content;
    row.append(label, body);
    container.append(row);
  });
  container.scrollTop = container.scrollHeight;
}

export function initAssistantPanel(input) {
  const { getChatExtraFields, saveDashboardView, state } = input;
  const messages = [];
  const listEl = document.getElementById("assistant-messages");
  const form = document.getElementById("assistant-form");
  const inputEl = document.getElementById("assistant-input");
  const statusEl = document.getElementById("assistant-status");

  applyAssistantWidthFromState(state);
  syncAssistantPanel(state);

  function setStatus(text) {
    statusEl.textContent = text;
  }

  async function refreshStatus() {
    const res = await fetch("/api/assistant/status");
    if (!res.ok) {
      setStatus("Status unavailable.");
      return;
    }
    const data = await res.json();
    const parts = [];
    if (data.hasChatKey) {
      parts.push(`Model: ${data.model}`);
    } else {
      parts.push("Set VEXKIT_CHAT_API_KEY");
    }
    if (data.mcpConfigured) {
      parts.push("MCP configured");
    }
    if (data.repoAgentTools) {
      parts.push("Repo agent tools");
    }
    setStatus(parts.join(" · "));
  }

  function buildPayload() {
    const base = {
      messages: messages.map((m) => ({ content: m.content, role: m.role })),
    };
    const extra = typeof getChatExtraFields === "function" ? getChatExtraFields() : {};
    return { ...base, ...extra };
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
    setStatus("Thinking…");
    messages.push({ content: "", role: "assistant" });
    renderChatMessages(listEl, messages);
    const assistantIdx = messages.length - 1;

    const res = await fetch("/api/assistant/chat", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!res.ok) {
      const errText = await res.text();
      messages[assistantIdx].content = `Request failed (${String(res.status)}): ${errText}`;
      renderChatMessages(listEl, messages);
      void refreshStatus();
      return;
    }

    const reader = res.body?.getReader();
    if (reader == null) {
      messages[assistantIdx].content = "Empty response.";
      renderChatMessages(listEl, messages);
      return;
    }

    const dec = new TextDecoder();
    let carry = "";
    let acc = "";
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
          acc += ev.text;
          messages[assistantIdx].content = acc;
          renderChatMessages(listEl, messages);
        }
        if (ev.type === "error" && typeof ev.message === "string") {
          acc += `\n${ev.message}`;
          messages[assistantIdx].content = acc;
          renderChatMessages(listEl, messages);
        }
      });
    }
    void refreshStatus();
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

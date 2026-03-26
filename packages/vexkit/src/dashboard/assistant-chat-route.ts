import { tryCatchAsync } from "@vex-app/lib";
import { ndjsonLine } from "./assistant-openai.js";
import { isCursorAgentConfigured, runCursorAcpPrompt } from "./cursor-acp-session.js";
import { isRecord, jsonResponse } from "./dashboard-helpers.js";
import { isMcpConfiguredInEnv } from "./mcp-session.js";
import {
  DESCRIBE_CONFIRM_PHRASE,
  SIGNAL_BUILD_DONE,
  SIGNAL_NEED_SPEC_CHANGE,
  SIGNAL_SCOPE_READY,
  buildStepPrompt,
} from "./workflow-scripts.js";

let assistantProjectRoot = "";

export function setAssistantProjectContext(path: string): void {
  assistantProjectRoot = path;
}

export function getAssistantStatusResponse(): Response {
  return jsonResponse(
    {
      cursorConfigured: isCursorAgentConfigured(),
      mcpConfigured: isMcpConfiguredInEnv(),
    },
    200,
  );
}

type IncomingMsg = { content: string; role: "assistant" | "user" };

type ParsedChat = { messages: IncomingMsg[]; step: number };

const EMPTY_CHAT: ParsedChat = { messages: [], step: 0 };

function parseChatBody(data: unknown): ParsedChat {
  if (!isRecord(data)) {
    return EMPTY_CHAT;
  }
  const rawMessages = data.messages;
  if (!Array.isArray(rawMessages)) {
    return EMPTY_CHAT;
  }
  const out: IncomingMsg[] = [];
  for (const item of rawMessages) {
    if (!isRecord(item)) {
      return EMPTY_CHAT;
    }
    const role = item.role;
    const content = item.content;
    if (role !== "user" && role !== "assistant") {
      return EMPTY_CHAT;
    }
    if (typeof content !== "string") {
      return EMPTY_CHAT;
    }
    const trimmed = content.length > 12000 ? `${content.slice(0, 12000)}\n\n(message truncated)` : content;
    out.push({ content: trimmed, role });
  }
  if (out.length === 0 || out.length > 80) {
    return EMPTY_CHAT;
  }
  const stepRaw = data.step;
  const step =
    typeof stepRaw === "number" && Number.isFinite(stepRaw) ? Math.max(0, Math.min(5, Math.floor(stepRaw))) : 0;
  return { messages: out, step };
}

function transcriptFromMessages(messages: IncomingMsg[]): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
}

function ndjsonErrorResponse(message: string, status: number): Response {
  return new Response(ndjsonLine({ message, type: "error" }), {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    status,
  });
}

function truncateFromUnclosedOpenTag(text: string, openPattern: RegExp, closeLiteral: string): string {
  const m = openPattern.exec(text);
  if (m == null) {
    return text;
  }
  const start = m.index;
  const afterOpen = text.slice(start + m[0].length);
  if (afterOpen.includes(closeLiteral)) {
    return text;
  }
  return text.slice(0, start);
}

function stripThinkingBlocks(text: string): string {
  const pairs: [RegExp, RegExp, string][] = [
    [/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, /<thinking\b[^>]*>/i, "</thinking>"],
    [/<think\b[^>]*>[\s\S]*?<\/think>/gi, /<think\b[^>]*>/i, "`</think>`"],
    [/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, /<reasoning\b[^>]*>/i, "</reasoning>"],
    [/<thought\b[^>]*>[\s\S]*?<\/thought>/gi, /<thought\b[^>]*>/i, "</thought>"],
    [/<analysis\b[^>]*>[\s\S]*?<\/analysis>/gi, /<analysis\b[^>]*>/i, "</analysis>"],
    [/<scratchpad\b[^>]*>[\s\S]*?<\/scratchpad>/gi, /<scratchpad\b[^>]*>/i, "</scratchpad>"],
    [/<redacted_reasoning\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi, /<redacted_reasoning\b[^>]*>/i, "</think>"],
  ];
  let out = text;
  for (const [pairRe, openRe, close] of pairs) {
    out = out.replace(pairRe, "");
    out = truncateFromUnclosedOpenTag(out, openRe, close);
  }
  return out;
}

function stripCodeBlocks(text: string): string {
  let out = text.replace(/```[\s\S]*?```/g, "");
  out = out.replace(/`[^`\n]+`/g, "");
  return out;
}

function countQuestionMarks(text: string): number {
  const cleaned = stripCodeBlocks(text);
  let count = 0;
  for (let i = 0; i < cleaned.length; i += 1) {
    if (cleaned[i] === "?") {
      count += 1;
    }
  }
  return count;
}

function describeHeuristicShouldAdvance(visibleText: string): boolean {
  if (visibleText.trim().length < 20) {
    return false;
  }
  const withoutConfirm = visibleText.replace(DESCRIBE_CONFIRM_PHRASE, "");
  return countQuestionMarks(withoutConfirm) === 0;
}

function noQuestionsHeuristic(visibleText: string): boolean {
  if (visibleText.trim().length < 20) {
    return false;
  }
  return countQuestionMarks(visibleText) === 0;
}

function logDebug(msg: string): void {
  process.stderr.write(`[vexkit-workflow] ${msg}\n`);
}

function detectSignalEvents(fullText: string, step: number): Uint8Array[] {
  const enc = new TextEncoder();
  const events: Uint8Array[] = [];
  const visible = stripThinkingBlocks(fullText);

  logDebug(
    `detectSignalEvents — step=${String(step)}, visibleLen=${String(visible.length)}, qMarks=${String(countQuestionMarks(visible))}`,
  );
  logDebug(`  last120chars=${JSON.stringify(visible.slice(-120))}`);

  const describeReady =
    step === 0 && [visible.includes(SIGNAL_SCOPE_READY), describeHeuristicShouldAdvance(visible)].some(Boolean);
  if (describeReady) {
    logDebug("  -> emitting step_change to SPEC (step 1)");
    events.push(enc.encode(ndjsonLine({ step: 1, type: "step_change" })));
  }

  if (step === 1) {
    logDebug("  -> SPEC complete, emitting step_change to APPROVE (step 2)");
    events.push(enc.encode(ndjsonLine({ step: 2, type: "step_change" })));
  }

  if (step === 3 && visible.includes(SIGNAL_NEED_SPEC_CHANGE)) {
    const idx = visible.indexOf(SIGNAL_NEED_SPEC_CHANGE);
    const reason = visible.slice(idx + SIGNAL_NEED_SPEC_CHANGE.length).trim();
    logDebug("  -> emitting spec_change_request");
    events.push(
      enc.encode(
        ndjsonLine({ reason: reason.length > 0 ? reason : "The spec needs changes.", type: "spec_change_request" }),
      ),
    );
  }

  const buildReady =
    step === 3 &&
    !visible.includes(SIGNAL_NEED_SPEC_CHANGE) &&
    [visible.includes(SIGNAL_BUILD_DONE), noQuestionsHeuristic(visible)].some(Boolean);
  if (buildReady) {
    logDebug("  -> emitting step_change to VERIFY (step 4)");
    events.push(enc.encode(ndjsonLine({ step: 4, type: "step_change" })));
  }

  logDebug(`  totalEvents=${String(events.length)}`);
  return events;
}

function ndjsonCursorStreamResponse(input: { messages: IncomingMsg[]; rootAbs: string; step: number }): Response {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        let streamEnded = false;
        function safeEnqueue(chunk: Uint8Array): boolean {
          if (streamEnded) {
            return false;
          }
          try {
            controller.enqueue(chunk);
            return true;
          } catch {
            streamEnded = true;
            return false;
          }
        }
        function safeClose(): void {
          if (streamEnded) {
            return;
          }
          try {
            controller.close();
          } catch {
            /* already closed */
          }
          streamEnded = true;
        }
        const systemPrompt = buildStepPrompt(input.step, input.rootAbs);
        const transcript = transcriptFromMessages(input.messages);
        const promptText = `${systemPrompt}\n\n${transcript}`;
        const keepalive = setInterval(() => {
          safeEnqueue(enc.encode(ndjsonLine({ type: "keepalive" })));
        }, 10_000);
        const [run, err] = await tryCatchAsync(async () =>
          runCursorAcpPrompt({
            onDelta: (t) => {
              safeEnqueue(enc.encode(ndjsonLine({ text: t, type: "delta" })));
            },
            promptText,
            rootAbs: input.rootAbs,
            step: input.step,
          }),
        );
        clearInterval(keepalive);
        if (err != null) {
          safeEnqueue(enc.encode(ndjsonLine({ message: err.message, type: "error" })));
          safeEnqueue(enc.encode(ndjsonLine({ type: "done" })));
          safeClose();
          return;
        }
        if (!run.ok) {
          safeEnqueue(enc.encode(ndjsonLine({ message: run.message, type: "error" })));
          safeEnqueue(enc.encode(ndjsonLine({ type: "done" })));
          safeClose();
          return;
        }
        const signalEvents = detectSignalEvents(run.fullText, input.step);
        signalEvents.forEach((ev) => safeEnqueue(ev));
        safeEnqueue(enc.encode(ndjsonLine({ type: "done" })));
        safeClose();
      },
    }),
    {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    },
  );
}

const AFFIRMATIVE_WORDS = new Set([
  "y",
  "ye",
  "yes",
  "yeah",
  "yep",
  "yup",
  "sure",
  "ok",
  "okay",
  "go",
  "lgtm",
  "proceed",
  "ready",
  "confirm",
  "approved",
]);

const NEGATIVE_WORDS = new Set(["no", "nah", "nope", "dont", "stop", "wait", "hold", "cancel", "change", "wrong"]);

function isAffirmativeReply(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/);
  if (words.some((w) => NEGATIVE_WORDS.has(w))) {
    return false;
  }
  return words.some((w) => AFFIRMATIVE_WORDS.has(w));
}

function isDescribeConfirmReply(messages: IncomingMsg[], step: number): boolean {
  if (step !== 0) {
    return false;
  }
  if (messages.length < 2) {
    return false;
  }
  const lastUser = messages.at(-1);
  const lastAssistant = messages.at(-2);
  if (lastUser == null || lastAssistant == null) {
    return false;
  }
  if (lastUser.role !== "user" || lastAssistant.role !== "assistant") {
    return false;
  }
  if (!lastAssistant.content.includes(DESCRIBE_CONFIRM_PHRASE)) {
    return false;
  }
  return isAffirmativeReply(lastUser.content.trim());
}

function ndjsonImmediateAdvanceResponse(nextStep: number): Response {
  const body = [
    ndjsonLine({ text: "Moving on.", type: "delta" }),
    ndjsonLine({ step: nextStep, type: "step_change" }),
    ndjsonLine({ type: "done" }),
  ].join("");
  return new Response(body, {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-ndjson; charset=utf-8",
    },
  });
}

export async function postAssistantChat(req: Request): Promise<Response> {
  const [rawBody, bodyErr] = await tryCatchAsync(async () => req.json());
  if (bodyErr != null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  if (rawBody == null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  const parsed = parseChatBody(rawBody);
  if (parsed.messages.length === 0) {
    return jsonResponse({ message: "Invalid chat messages." }, 400);
  }

  if (isDescribeConfirmReply(parsed.messages, parsed.step)) {
    logDebug("Describe confirm reply detected — short-circuiting to SPEC");
    return ndjsonImmediateAdvanceResponse(1);
  }

  if (!isCursorAgentConfigured()) {
    return ndjsonErrorResponse(
      "Cursor agent is not configured. Set VEXKIT_USE_CURSOR_AGENT=1 and CURSOR_API_KEY.",
      503,
    );
  }

  return ndjsonCursorStreamResponse({
    messages: parsed.messages,
    rootAbs: assistantProjectRoot,
    step: parsed.step,
  });
}

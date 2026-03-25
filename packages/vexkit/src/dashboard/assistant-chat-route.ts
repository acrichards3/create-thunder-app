import { tryCatchAsync } from "@vex-app/lib";
import { buildBuildSystemPrompt, buildSpecSystemPrompt, DESCRIBE_WORKFLOW_INTRO } from "./cursor-assistant-prompts.js";
import { isCursorAgentConfigured, runCursorAcpPrompt, shouldUseCursorAgent } from "./cursor-acp-session.js";
import {
  completeChatNonStreaming,
  getAssistantChatEnv,
  ndjsonLine,
  type OpenAiChatMessage,
} from "./assistant-openai.js";
import { executeRepoTool, getRepoToolsOpenAiDefinitions, REPO_TOOL_NAMES } from "./assistant-repo-tools.js";
import { readWorkflowState, type WorkflowPhase } from "./workflow-store.js";
import {
  callMcpTool,
  isMcpConfiguredInEnv,
  listMcpTools,
  mcpToolsToOpenAiShapes,
  setMcpProjectRootForSession,
} from "./mcp-session.js";

let assistantProjectRoot = "";

export function setAssistantProjectContext(path: string): void {
  assistantProjectRoot = path;
  setMcpProjectRootForSession(path);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    status,
  });
}

export function getAssistantStatusResponse(): Response {
  const env = getAssistantChatEnv();
  return jsonResponse(
    {
      hasChatKey: env.hasApiKey,
      hasCursorKey: isCursorAgentConfigured(),
      mcpConfigured: isMcpConfiguredInEnv(),
      model: env.model,
      repoAgentTools: true,
      useCursorAgent: shouldUseCursorAgent(),
    },
    200,
  );
}

type IncomingMsg = { content: string; role: "assistant" | "user" };

function parseChatBody(data: unknown): IncomingMsg[] {
  if (!isRecord(data)) {
    return [];
  }
  const messages = data.messages;
  if (!Array.isArray(messages)) {
    return [];
  }
  const out: IncomingMsg[] = [];
  for (const item of messages) {
    if (!isRecord(item)) {
      return [];
    }
    const role = item.role;
    const content = item.content;
    if (role !== "user" && role !== "assistant") {
      return [];
    }
    if (typeof content !== "string") {
      return [];
    }
    if (content.length > 20000) {
      return [];
    }
    out.push({ content, role });
  }
  if (out.length === 0 || out.length > 80) {
    return [];
  }
  return out;
}

function parseHasSpokenToAssistant(data: unknown): boolean {
  if (!isRecord(data)) {
    return false;
  }
  const v = data.hasSpokenToAssistant;
  if (typeof v === "boolean") {
    return v;
  }
  return false;
}

function transcriptFromMessages(messages: IncomingMsg[]): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
}

function buildCursorPromptText(input: {
  hasSpokenToAssistant: boolean;
  messages: IncomingMsg[];
  phase: WorkflowPhase;
  rootAbs: string;
}): string {
  const { hasSpokenToAssistant, messages, phase, rootAbs } = input;
  if (phase === "spec" && !hasSpokenToAssistant) {
    const lastUser = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    return `${DESCRIBE_WORKFLOW_INTRO}${lastUser}`;
  }
  if (phase === "spec") {
    return `${buildSpecSystemPrompt(rootAbs)}\n\n${transcriptFromMessages(messages)}`;
  }
  if (phase === "build") {
    return `${buildBuildSystemPrompt(rootAbs)}\n\n${transcriptFromMessages(messages)}`;
  }
  return `${buildBuildSystemPrompt(rootAbs)}\n\n${transcriptFromMessages(messages)}`;
}

function ndjsonErrorResponse(message: string, status: number): Response {
  return new Response(ndjsonLine({ message, type: "error" }), {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    status,
  });
}

function ndjsonTextResponse(text: string): Response {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(ndjsonLine({ text, type: "delta" })));
        controller.enqueue(enc.encode(ndjsonLine({ type: "done" })));
        controller.close();
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

function ndjsonCursorStreamResponse(input: {
  hasSpokenToAssistant: boolean;
  messages: IncomingMsg[];
  phase: WorkflowPhase;
  rootAbs: string;
}): Response {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        const promptText = buildCursorPromptText({
          hasSpokenToAssistant: input.hasSpokenToAssistant,
          messages: input.messages,
          phase: input.phase,
          rootAbs: input.rootAbs,
        });
        const [run, err] = await tryCatchAsync(async () =>
          runCursorAcpPrompt({
            onDelta: (t) => {
              controller.enqueue(enc.encode(ndjsonLine({ text: t, type: "delta" })));
            },
            phase: input.phase,
            promptText,
            rootAbs: input.rootAbs,
          }),
        );
        if (err != null) {
          controller.enqueue(enc.encode(ndjsonLine({ message: err.message, type: "error" })));
          controller.enqueue(enc.encode(ndjsonLine({ type: "done" })));
          controller.close();
          return;
        }
        if (!run.ok) {
          controller.enqueue(enc.encode(ndjsonLine({ message: run.message, type: "error" })));
          controller.enqueue(enc.encode(ndjsonLine({ type: "done" })));
          controller.close();
          return;
        }
        controller.enqueue(enc.encode(ndjsonLine({ type: "done" })));
        controller.close();
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

const MAX_TOOL_ROUNDS = 24;

function isCompletionFailure(x: { assistantMessage: OpenAiChatMessage } | { error: string }): x is { error: string } {
  return !Object.prototype.hasOwnProperty.call(x, "assistantMessage");
}

async function dispatchToolCall(input: {
  argumentsJson: string;
  name: string;
  rootAbs: string;
  workflowPhase: WorkflowPhase;
}): Promise<string> {
  if (REPO_TOOL_NAMES.has(input.name)) {
    return executeRepoTool({
      argumentsJson: input.argumentsJson,
      name: input.name,
      rootAbs: input.rootAbs,
      workflowPhase: input.workflowPhase,
    });
  }
  return callMcpTool({
    argumentsJson: input.argumentsJson,
    name: input.name,
  });
}

async function respondWithAgentToolLoop(
  conversation: OpenAiChatMessage[],
  toolsOpenAi: Array<{
    function: { description?: string; name: string; parameters: Record<string, unknown> };
    type: "function";
  }>,
  rootAbs: string,
  workflowPhase: WorkflowPhase,
): Promise<Response> {
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await completeChatNonStreaming({
      messages: conversation,
      tools: toolsOpenAi,
    });
    if (isCompletionFailure(completion)) {
      return ndjsonErrorResponse(completion.error, 502);
    }
    const msg = completion.assistantMessage;
    conversation.push(msg);
    if (msg.role === "assistant" && msg.tool_calls != null && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const result = await dispatchToolCall({
          argumentsJson: tc.function.arguments,
          name: tc.function.name,
          rootAbs,
          workflowPhase,
        });
        conversation.push({
          content: result,
          role: "tool",
          tool_call_id: tc.id,
        });
      }
      continue;
    }
    const text = msg.content;
    if (text == null || text.length === 0) {
      return ndjsonErrorResponse("Empty assistant response.", 502);
    }
    return ndjsonTextResponse(text);
  }

  return ndjsonErrorResponse("Too many tool rounds.", 502);
}

function phaseHintForOpenAi(phase: WorkflowPhase): string {
  if (phase === "spec") {
    return "Workflow phase is SPEC: you may only write or replace content in files whose path ends with .vex.";
  }
  if (phase === "verify" || phase === "done") {
    return "Workflow phase is VERIFY/DONE: chat should not run; if forced, do not modify .vex files.";
  }
  return "Workflow phase is BUILD: do not modify .vex files; implement co-located .spec.ts and application source instead.";
}

export async function postAssistantChat(req: Request): Promise<Response> {
  const [rawBody, bodyErr] = await tryCatchAsync(async () => req.json());
  if (bodyErr != null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  if (rawBody == null) {
    return jsonResponse({ message: "Invalid JSON body." }, 400);
  }
  const messages = parseChatBody(rawBody);
  if (messages.length === 0) {
    return jsonResponse({ message: "Invalid chat messages." }, 400);
  }

  const wf = await readWorkflowState(assistantProjectRoot);
  if (wf.phase === "verify" || wf.phase === "done") {
    return ndjsonErrorResponse("Chat is disabled in the verify and done steps.", 400);
  }

  const hasSpokenToAssistant = parseHasSpokenToAssistant(rawBody);

  if (shouldUseCursorAgent()) {
    return ndjsonCursorStreamResponse({
      hasSpokenToAssistant,
      messages,
      phase: wf.phase,
      rootAbs: assistantProjectRoot,
    });
  }

  const env = getAssistantChatEnv();
  if (!env.hasApiKey) {
    return ndjsonErrorResponse(
      "Set VEXKIT_CHAT_API_KEY to enable chat, or set VEXKIT_USE_CURSOR_AGENT=1 and CURSOR_API_KEY for Cursor.",
      503,
    );
  }

  const phaseHint = phaseHintForOpenAi(wf.phase);
  const systemLine = `You are a coding agent in the vexkit spec dashboard. Project root: ${assistantProjectRoot}. ${phaseHint} You MUST use the repo_* tools to read and change files (repo_list_dir, repo_read_file, repo_write_file, repo_search_replace). Paths are always relative to the project root. Do not use absolute paths or parent segments. You cannot access .git or node_modules or write under .vexkit/. After editing, summarize what changed. When MCP tools are also available, you may use them as needed.`;
  const history: OpenAiChatMessage[] = messages.map((m) => ({
    content: m.content,
    role: m.role,
  }));
  const conversation: OpenAiChatMessage[] = [{ content: systemLine, role: "system" }, ...history];

  const repoDefs = getRepoToolsOpenAiDefinitions();
  const mcpTools = mcpToolsToOpenAiShapes(await listMcpTools());
  const allTools = [...repoDefs, ...mcpTools];

  return respondWithAgentToolLoop(conversation, allTools, assistantProjectRoot, wf.phase);
}

import { tryCatchAsync } from "@vex-app/lib";
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
      mcpConfigured: isMcpConfiguredInEnv(),
      model: env.model,
      repoAgentTools: true,
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

  const env = getAssistantChatEnv();
  if (!env.hasApiKey) {
    return ndjsonErrorResponse("Set VEXKIT_CHAT_API_KEY to enable chat.", 503);
  }

  const wf = await readWorkflowState(assistantProjectRoot);
  const phaseHint =
    wf.phase === "spec"
      ? "Workflow phase is SPEC: you may only write or replace content in files whose path ends with .vex."
      : "Workflow phase is BUILD/DONE: do not modify .vex files; implement co-located .spec.ts and application source instead.";
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

import { tryCatchAsync } from "@vex-app/lib";
import { buildAssistantSystemPrompt } from "./cursor-assistant-prompts.js";
import { isCursorAgentConfigured, runCursorAcpPrompt } from "./cursor-acp-session.js";
import { ndjsonLine } from "./assistant-openai.js";
import { isMcpConfiguredInEnv } from "./mcp-session.js";
import { isRecord, jsonResponse } from "./dashboard-helpers.js";

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

function transcriptFromMessages(messages: IncomingMsg[]): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
}

function ndjsonErrorResponse(message: string, status: number): Response {
  return new Response(ndjsonLine({ message, type: "error" }), {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
    status,
  });
}

function ndjsonCursorStreamResponse(input: { messages: IncomingMsg[]; rootAbs: string }): Response {
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
        const systemPrompt = buildAssistantSystemPrompt(input.rootAbs);
        const transcript = transcriptFromMessages(input.messages);
        const promptText = `${systemPrompt}\n\n${transcript}`;
        const [run, err] = await tryCatchAsync(async () =>
          runCursorAcpPrompt({
            onDelta: (t) => {
              safeEnqueue(enc.encode(ndjsonLine({ text: t, type: "delta" })));
            },
            promptText,
            rootAbs: input.rootAbs,
          }),
        );
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

  if (!isCursorAgentConfigured()) {
    return ndjsonErrorResponse(
      "Cursor agent is not configured. Set VEXKIT_USE_CURSOR_AGENT=1 and CURSOR_API_KEY.",
      503,
    );
  }

  return ndjsonCursorStreamResponse({
    messages,
    rootAbs: assistantProjectRoot,
  });
}

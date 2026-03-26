type NdjsonChatEvent =
  | { message: string; type: "error" }
  | { reason: string; type: "spec_change_request" }
  | { step: number; type: "step_change" }
  | { text: string; type: "delta" }
  | { type: "done" }
  | { type: "keepalive" };

export function ndjsonLine(event: NdjsonChatEvent): string {
  return `${JSON.stringify(event)}\n`;
}

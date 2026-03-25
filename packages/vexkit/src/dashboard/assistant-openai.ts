type NdjsonChatEvent = { message: string; type: "error" } | { text: string; type: "delta" } | { type: "done" };

export function ndjsonLine(event: NdjsonChatEvent): string {
  return `${JSON.stringify(event)}\n`;
}

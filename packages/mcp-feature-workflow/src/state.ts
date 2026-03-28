import type { WorkflowState, StartWorkflowResult } from "./types.js";

export const globalSessionStore = new Map<string, WorkflowState>();

let httpPort: number;
let httpBase: string;

export function setHttpServerInfo(port: number): void {
  httpPort = port;
  httpBase = `http://localhost:${port}`;
}

export function getDashboardUrl(sessionId: string): string {
  return `${httpBase}/dashboard?session=${encodeURIComponent(sessionId)}`;
}

export function getSession(sessionId: string): WorkflowState | undefined {
  return globalSessionStore.get(sessionId);
}

export function updateSession(sessionId: string, updates: Partial<WorkflowState>): void {
  const existing = globalSessionStore.get(sessionId);
  if (existing) {
    globalSessionStore.set(sessionId, { ...existing, ...updates });
  }
}

export function deleteSession(sessionId: string): void {
  globalSessionStore.delete(sessionId);
}

// Cleanup sessions older than 24h every hour
setInterval(
  () => {
    const now = Date.now();
    for (const [sessionId, state] of globalSessionStore.entries()) {
      // For now, just keep sessions alive indefinitely
      // Could add expiration based on last activity timestamp if needed
    }
  },
  60 * 60 * 1000,
);

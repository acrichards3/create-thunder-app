// Bidirectional postMessage protocol between webview (dashboard) and extension host

import type { DashboardState } from "./types.ts";

// Messages sent from webview TO extension host
export type OutgoingMsg =
  | { type: "ready" }
  | { type: "state-update"; patch: Partial<DashboardState> }
  | {
      type: "api-request";
      requestId: string;
      method: string;
      url: string;
      body?: string;
    }
  | { type: "open-file"; path: string }
  | { type: "workflow-step-change"; step: number }
  | { type: "node-edit"; path: string; nodePath: number[]; newLabel: string }
  | { type: "session-update"; patch: Partial<DashboardState> };

// Messages sent from extension host TO webview
export type IncomingMsg =
  | { type: "init"; state: DashboardState; baseUrl: string; sessionId: string }
  | { type: "api-response"; requestId: string; ok: boolean; body: string }
  | { type: "file-changed"; path: string }
  | { type: "session-update"; patch: Partial<DashboardState> };

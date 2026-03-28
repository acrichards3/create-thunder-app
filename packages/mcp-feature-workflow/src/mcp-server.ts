import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { StartWorkflowResult } from "./types.js";
import { globalSessionStore, getDashboardUrl } from "./state.js";
import { generateSessionId } from "./utils.js";

export const WORKFLOW_TOOL_NAME = "start_feature_workflow";

const StartWorkflowSchema = z.object({
  featureName: z.string().describe("The name of the feature being built"),
  step: z
    .enum(["describe", "spec", "approve", "build", "verify", "done"])
    .optional()
    .describe("The current workflow step to resume from"),
  sessionId: z
    .string()
    .optional()
    .describe(
      "A unique session ID. If omitted, a new session is created. Pass the same ID to resume an existing workflow.",
    ),
  tree: z
    .object({
      name: z.string(),
      path: z.string(),
      isDir: z.boolean(),
      children: z
        .array(
          z.object({
            name: z.string(),
            path: z.string(),
            isDir: z.boolean(),
            children: z.array(z.unknown()).optional(),
          }),
        )
        .optional(),
    })
    .optional()
    .describe("The file tree structure (FileTreeNode) for the sidebar"),
  vexDocuments: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Record of parsed .vex document contents keyed by file path"),
  approvalsByPath: z.record(z.string(), z.array(z.string())).optional(),
  currentPath: z.string().nullable().optional(),
});

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "feature-workflow",
    version: "1.0.0",
  });

  server.registerTool(
    WORKFLOW_TOOL_NAME,
    {
      description:
        "Launches the 6-step AI-assisted feature workflow UI (Describe → Spec → Approve → Build → Verify → Done) as an embedded iframe inside Cursor. The workflow uses .vex files to represent feature specs as interactive logic trees.",
      inputSchema: StartWorkflowSchema,
    },
    async ({ args }) => {
      const params = args;
      const sessionId = params.sessionId && params.sessionId.length > 0 ? params.sessionId : generateSessionId();

      const state = {
        featureName: params.featureName,
        step: (params.step as "describe" | "spec" | "approve" | "build" | "verify" | "done" | undefined) ?? "describe",
        tree: params.tree ?? {
          name: ".vexkit",
          path: ".vexkit",
          isDir: true,
          children: [],
        },
        vexDocuments: (params.vexDocuments as Record<string, unknown>) ?? {},
        approvalsByPath: params.approvalsByPath ?? {},
        currentPath: params.currentPath ?? null,
        sessionId,
      };

      globalSessionStore.set(sessionId, state as never);

      const url = getDashboardUrl(sessionId);

      return {
        content: [
          {
            type: "text" as const,
            text: `Launching workflow: ${params.featureName}\nSession: ${sessionId}\nDashboard: ${url}`,
          },
          {
            type: "resource" as const,
            resource: {
              uri: url,
              mimeType: "text/uri-list",
              text: url,
            },
          },
        ],
      };
    },
  );

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

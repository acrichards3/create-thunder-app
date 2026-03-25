import { tryCatch } from "@vex-app/lib";
import {
  handleRepoListDir,
  handleRepoReadFile,
  handleRepoSearchReplace,
  handleRepoWriteFile,
} from "./assistant-repo-tool-impl.js";
import { getRepoWriteDenialReason } from "./repo-write-policy.js";
import type { WorkflowPhase } from "./workflow-store.js";

export const REPO_TOOL_NAMES_LIST = [
  "repo_list_dir",
  "repo_read_file",
  "repo_search_replace",
  "repo_write_file",
] as const;

export type RepoToolName = (typeof REPO_TOOL_NAMES_LIST)[number];

export const REPO_TOOL_NAMES = new Set<string>(REPO_TOOL_NAMES_LIST);

function isRepoToolName(name: string): name is RepoToolName {
  return REPO_TOOL_NAMES.has(name);
}

export function getRepoToolsOpenAiDefinitions(): Array<{
  function: { description: string; name: string; parameters: Record<string, unknown> };
  type: "function";
}> {
  return [
    {
      function: {
        description:
          'List files and subdirectories (one level). path is relative to project root; use "" for root. You can edit the repo with repo_read_file, repo_write_file, and repo_search_replace.',
        name: "repo_list_dir",
        parameters: {
          additionalProperties: false,
          properties: {
            path: { description: "Relative directory path; empty string for project root.", type: "string" },
          },
          required: ["path"],
          type: "object",
        },
      },
      type: "function" as const,
    },
    {
      function: {
        description: "Read a UTF-8 text file. Path relative to project root.",
        name: "repo_read_file",
        parameters: {
          additionalProperties: false,
          properties: {
            path: { type: "string" },
          },
          required: ["path"],
          type: "object",
        },
      },
      type: "function" as const,
    },
    {
      function: {
        description: "Create or overwrite a UTF-8 file. Creates parent directories. Path relative to project root.",
        name: "repo_write_file",
        parameters: {
          additionalProperties: false,
          properties: {
            content: { type: "string" },
            path: { type: "string" },
          },
          required: ["path", "content"],
          type: "object",
        },
      },
      type: "function" as const,
    },
    {
      function: {
        description:
          "Replace exactly one occurrence of old_string with new_string. old_string must be unique in the file.",
        name: "repo_search_replace",
        parameters: {
          additionalProperties: false,
          properties: {
            new_string: { type: "string" },
            old_string: { type: "string" },
            path: { type: "string" },
          },
          required: ["path", "old_string", "new_string"],
          type: "object",
        },
      },
      type: "function" as const,
    },
  ];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

const repoToolRunners: Record<
  RepoToolName,
  (args: Record<string, unknown>, rootAbs: string, workflowPhase: WorkflowPhase) => Promise<string>
> = {
  repo_list_dir: async (args, rootAbs, _workflowPhase) => {
    const pathVal = args.path;
    if (typeof pathVal !== "string") {
      return "Missing path.";
    }
    return handleRepoListDir({ rawPath: pathVal, rootAbs });
  },
  repo_read_file: async (args, rootAbs, _workflowPhase) => {
    const pathVal = args.path;
    if (typeof pathVal !== "string") {
      return "Missing path.";
    }
    return handleRepoReadFile({ rawPath: pathVal, rootAbs });
  },
  repo_search_replace: async (args, rootAbs, workflowPhase) => {
    const pathVal = args.path;
    const oldVal = args.old_string;
    const newVal = args.new_string;
    if (typeof pathVal !== "string") {
      return "Missing path, old_string, or new_string.";
    }
    if (typeof oldVal !== "string") {
      return "Missing path, old_string, or new_string.";
    }
    if (typeof newVal !== "string") {
      return "Missing path, old_string, or new_string.";
    }
    const deny = getRepoWriteDenialReason(workflowPhase, pathVal);
    if (deny.length > 0) {
      return deny;
    }
    return handleRepoSearchReplace({
      new_string: newVal,
      old_string: oldVal,
      rawPath: pathVal,
      rootAbs,
    });
  },
  repo_write_file: async (args, rootAbs, workflowPhase) => {
    const pathVal = args.path;
    const contentVal = args.content;
    if (typeof pathVal !== "string") {
      return "Missing path or content.";
    }
    if (typeof contentVal !== "string") {
      return "Missing path or content.";
    }
    const deny = getRepoWriteDenialReason(workflowPhase, pathVal);
    if (deny.length > 0) {
      return deny;
    }
    return handleRepoWriteFile({ content: contentVal, rawPath: pathVal, rootAbs });
  },
};

export async function executeRepoTool(input: {
  argumentsJson: string;
  name: string;
  rootAbs: string;
  workflowPhase: WorkflowPhase;
}): Promise<string> {
  const [parsed, err] = tryCatch((): unknown => JSON.parse(input.argumentsJson));
  if (err != null) {
    return "Invalid tool arguments JSON.";
  }
  if (!isRecord(parsed)) {
    return "Invalid tool arguments JSON.";
  }
  if (!isRepoToolName(input.name)) {
    return "Unknown repo tool.";
  }
  return repoToolRunners[input.name](parsed, input.rootAbs, input.workflowPhase);
}

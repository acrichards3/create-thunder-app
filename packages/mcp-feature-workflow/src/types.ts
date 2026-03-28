// VEX AST types (mirrored from vexkit/src/vex/ast.ts for use in the MCP server)
export type VexIt = {
  kind: "it";
  label: string;
  line: number;
};

export type VexAnd = {
  child: VexBody | undefined;
  kind: "and";
  label: string;
  line: number;
};

export type VexBody = VexAnd | VexIt;

export type VexWhen = {
  branches: VexBody[];
  label: string;
  line: number;
};

export type VexFunction = {
  line: number;
  name: string;
  whens: VexWhen[];
};

export type VexDocument = {
  functions: VexFunction[];
};

export type WorkflowStep = "describe" | "spec" | "approve" | "build" | "verify" | "done";

export interface WorkflowState {
  featureName: string;
  step: WorkflowStep;
  tree: FileTreeNode;
  vexDocuments: Record<string, VexDocument>;
  approvalsByPath: Record<string, string[]>;
  currentPath: string | null;
  sessionId: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileTreeNode[];
}

export interface StartWorkflowParams {
  featureName: string;
  step: WorkflowStep;
  sessionId: string;
  tree?: FileTreeNode;
  vexDocuments?: Record<string, VexDocument>;
  approvalsByPath?: Record<string, string[]>;
  currentPath?: string | null;
}

export interface StartWorkflowResult {
  url: string;
  sessionId: string;
}

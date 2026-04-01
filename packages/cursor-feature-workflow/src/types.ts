// Shared types for postMessage communication between webview and extension host

export interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileTreeNode[];
}

export interface VexDocument {
  functions: VexFunction[];
}

export interface VexFunction {
  description: string;
  line: number;
  name: string;
  whens: VexWhen[];
}

export interface VexWhen {
  label: string;
  line: number;
  branches: VexBody[];
}

export type VexBody = VexAnd | VexIt;

export interface VexAnd {
  child: VexBody | undefined;
  kind: "and";
  label: string;
  line: number;
}

export interface VexIt {
  kind: "it";
  label: string;
  line: number;
}

export interface DashboardState {
  workflowStep: number;
  currentPath: string | null;
  tree: FileTreeNode[];
  parseResult: VexParseResult | null;
  approvalsByPath: Record<string, string[]>;
  selectedFnIndex: number;
  expandedDirs: string[];
  vexSource: string;
}

export interface VexParseResult {
  document: VexDocument | undefined;
  errors: readonly VexParseError[];
  ok: boolean;
}

export interface VexParseError {
  line: number;
  message: string;
}

export type WorkflowStep = "describe" | "spec" | "approve" | "build" | "verify" | "done";

export interface WorkflowState {
  featureName: string;
  step: WorkflowStep;
  tree: FileTreeNode[];
  vexDocuments: Record<string, VexDocument>;
  approvalsByPath: Record<string, string[]>;
  currentPath: string | null;
  sessionId: string;
}

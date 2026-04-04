import { installHooks, uninstallHooks } from "./workflow-hooks-manager";
import { deleteWorkflowRule, writeWorkflowRule } from "./workflow-rule-writer";
import { deleteWorkflowState, writeWorkflowState } from "./workflow-state";

export type WorkflowSyncParams = {
  activeId: string | null;
  enabled: boolean;
  lintErrors?: string[];
  step: number;
  workspaceRoot: string;
};

export function syncWorkflowToFiles(params: WorkflowSyncParams): void {
  if (!params.enabled) {
    cleanupWorkflowFiles(params.workspaceRoot);
    return;
  }
  writeWorkflowState(params.workspaceRoot, {
    activeId: params.activeId,
    enabled: true,
    step: params.step,
  });
  writeWorkflowRule(params.workspaceRoot, params.step, params.lintErrors);
  installHooks(params.workspaceRoot);
}

export function cleanupWorkflowFiles(workspaceRoot: string): void {
  deleteWorkflowState(workspaceRoot);
  deleteWorkflowRule(workspaceRoot);
  uninstallHooks(workspaceRoot);
}

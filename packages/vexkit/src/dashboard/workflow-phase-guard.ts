import type { WorkflowPhase } from "./workflow-store.js";

export function isWorkflowPhaseValue(v: unknown): v is WorkflowPhase {
  if (v === "spec") {
    return true;
  }
  if (v === "build") {
    return true;
  }
  if (v === "done") {
    return true;
  }
  return false;
}

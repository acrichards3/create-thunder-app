import { splitPathSegments } from "./assistant-repo-path.js";
import type { WorkflowPhase } from "./workflow-store.js";

export function getRepoWriteDenialReason(phase: WorkflowPhase, rawPath: string): string {
  const segments = splitPathSegments(rawPath);
  if (segments.length === 0) {
    return "";
  }
  if (segments[0] === ".vexkit") {
    return "Writes under .vexkit/ are not allowed for the assistant.";
  }
  const last = segments.at(-1) ?? "";
  const isVex = last.endsWith(".vex");
  if (phase === "spec") {
    if (!isVex) {
      return "Workflow phase is SPEC: only .vex files may be written. Use the dashboard to move to Build when the spec is approved.";
    }
    return "";
  }
  if (isVex) {
    return "Workflow phase is BUILD/VERIFY/DONE: .vex files are read-only for the assistant. Switch to Spec in the dashboard to edit .vex.";
  }
  return "";
}

export function isWriteAllowedForPhase(phase: WorkflowPhase, rawPath: string): boolean {
  return getRepoWriteDenialReason(phase, rawPath).length === 0;
}

import { canTransitionToBuild, canTransitionToDone, type WorkflowPhase, type WorkflowState } from "./workflow-store.js";

type DoneTransitionResult = { message: string; ok: boolean; status?: 400 };

function whenMovingToDone(input: {
  nextPhase: WorkflowPhase;
  prevPhase: WorkflowPhase;
  state: WorkflowState;
}): DoneTransitionResult {
  const { nextPhase, prevPhase, state } = input;
  if (nextPhase !== "done") {
    return { message: "", ok: true };
  }
  if (prevPhase === "verify") {
    const check = canTransitionToDone(state);
    if (!check.ok) {
      return { message: check.message, ok: false, status: 400 };
    }
    return { message: "", ok: true };
  }
  if (prevPhase === "done") {
    return { message: "", ok: true };
  }
  return { message: "Invalid transition to done.", ok: false, status: 400 };
}

export async function validateWorkflowPhaseChange(input: {
  nextPhase: WorkflowPhase;
  prevPhase: WorkflowPhase;
  rootAbs: string;
  nextState: WorkflowState;
  state: WorkflowState;
}): Promise<{ message: string; status: 400 } | null> {
  const { nextPhase, nextState, prevPhase, rootAbs, state } = input;

  if (nextPhase === "build" && prevPhase === "spec") {
    const check = await canTransitionToBuild({ rootAbs, state: nextState });
    if (!check.ok) {
      return { message: check.message, status: 400 };
    }
    return null;
  }

  if (nextPhase === "verify" && prevPhase !== "build") {
    return { message: "Can only move to verify from build.", status: 400 };
  }

  const doneRes = whenMovingToDone({ nextPhase, prevPhase, state });
  if (!doneRes.ok) {
    return { message: doneRes.message, status: doneRes.status ?? 400 };
  }

  if (nextPhase === "spec" && prevPhase === "done") {
    return { message: "Use resetWorkflow to restart from done.", status: 400 };
  }

  return null;
}

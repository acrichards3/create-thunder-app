import { tryCatchAsync } from "@vex-app/lib";
import { readWorkflowState, writeWorkflowState, type WorkflowState } from "./workflow-store.js";
import { runVerifyPipeline } from "./run-verify-pipeline.js";

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    status,
  });
}

export async function postWorkflowVerifyRun(rootAbs: string): Promise<Response> {
  const wf = await readWorkflowState(rootAbs);
  if (wf.phase !== "verify") {
    return jsonResponse({ message: "Verify run is only available in the verify phase." }, 400);
  }

  const [pipeline, pipeErr] = await tryCatchAsync(async () =>
    runVerifyPipeline({ currentVexPath: wf.currentVexPath, rootAbs }),
  );
  if (pipeErr != null) {
    return jsonResponse({ message: pipeErr.message }, 500);
  }

  const next: WorkflowState = {
    ...wf,
    verifyLastResult: { log: pipeline.log, ok: pipeline.ok },
  };
  await writeWorkflowState(rootAbs, next);

  return jsonResponse({ log: pipeline.log, ok: pipeline.ok, state: next }, pipeline.ok ? 200 : 422);
}

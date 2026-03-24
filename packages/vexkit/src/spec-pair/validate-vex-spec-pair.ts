import { parseAndValidateVexDocument } from "../vex/parse-and-validate-vex-document";
import { compareSpecStepLists, expectedStepsFromVexFunction } from "./spec-step-shape";
import { extractSpecStepsFromSource } from "./extract-spec-steps-from-ts";

export function validateVexSpecPair(input: { specSource: string; vexSource: string }): {
  message: string;
  ok: boolean;
} {
  const vexResult = parseAndValidateVexDocument(input.vexSource);
  if (!vexResult.ok) {
    return { message: "Invalid .vex document.", ok: false };
  }
  if (vexResult.document == null) {
    return { message: "Invalid .vex document.", ok: false };
  }

  const messages: string[] = [];

  for (const fn of vexResult.document.functions) {
    const expected = expectedStepsFromVexFunction(fn);
    const extracted = extractSpecStepsFromSource(input.specSource, fn.name);
    if (extracted.errorMessage.length > 0) {
      messages.push(`${fn.name}: ${extracted.errorMessage}`);
      continue;
    }
    const cmp = compareSpecStepLists(expected, extracted.steps);
    if (!cmp.ok) {
      messages.push(`${fn.name}: ${cmp.message}`);
    }
  }

  if (messages.length > 0) {
    return { message: messages.join("\n"), ok: false };
  }
  return { message: "", ok: true };
}

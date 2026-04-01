import { parseAndValidateVexDocument } from "../vex/parse-and-validate-vex-document";
import { compareSpecStepLists, expectedStepsFromDescribeBlock } from "./spec-step-shape";
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

  for (const root of vexResult.document.describes) {
    const expected = expectedStepsFromDescribeBlock(root);
    const extracted = extractSpecStepsFromSource(input.specSource, root.label);
    if (extracted.errorMessage.length > 0) {
      messages.push(`${root.label}: ${extracted.errorMessage}`);
      continue;
    }
    const cmp = compareSpecStepLists(expected, extracted.steps);
    if (!cmp.ok) {
      messages.push(`${root.label}: ${cmp.message}`);
    }
  }

  if (messages.length > 0) {
    return { message: messages.join("\n"), ok: false };
  }
  return { message: "", ok: true };
}

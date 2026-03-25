import type { VexBody, VexFunction } from "../vex/ast";

type SpecStepTag = "and" | "it" | "when";

export type SpecStep = {
  key: string;
  tag: SpecStepTag;
};

export function expectedStepsFromVexFunction(fn: VexFunction): SpecStep[] {
  const out: SpecStep[] = [];
  for (const w of fn.whens) {
    out.push({ key: `WHEN ${w.label}`, tag: "when" });
    for (const b of w.branches) {
      pushBodySteps(b, out);
    }
  }
  return out;
}

function pushBodySteps(body: VexBody, out: SpecStep[]): void {
  if (body.kind === "it") {
    out.push({ key: body.label, tag: "it" });
  } else {
    out.push({ key: `AND ${body.label}`, tag: "and" });
    if (body.child != null) {
      pushBodySteps(body.child, out);
    }
  }
}

export function compareSpecStepLists(
  expected: readonly SpecStep[],
  actual: readonly SpecStep[],
): { message: string; ok: boolean } {
  if (expected.length !== actual.length) {
    return {
      message: `Structure length mismatch: .vex expects ${String(expected.length)} nested steps, .spec.ts has ${String(actual.length)}.`,
      ok: false,
    };
  }
  for (let i = 0; i < expected.length; i += 1) {
    const e = expected[i];
    const a = actual[i];
    if (e.tag !== a.tag || e.key !== a.key) {
      return {
        message: `Step ${String(i + 1)}: expected ${e.tag} ${JSON.stringify(e.key)}, found ${a.tag} ${JSON.stringify(a.key)}.`,
        ok: false,
      };
    }
  }
  return { message: "", ok: true };
}

export function pairedSpecRelativePath(vexRelativePath: string): string {
  if (!vexRelativePath.endsWith(".vex")) {
    return "";
  }
  return `${vexRelativePath.slice(0, -".vex".length)}.spec.ts`;
}

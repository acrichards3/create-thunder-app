import type { VexBody, VexDocument, VexParseError, VexWhen } from "./ast";

function countItNodes(body: VexBody | undefined): number {
  if (body == null) {
    return 0;
  }

  if (body.kind === "it") {
    return 1;
  }

  return countItNodes(body.child);
}

function collectStructureErrors(body: VexBody | undefined, path: string): VexParseError[] {
  const out: VexParseError[] = [];

  if (body == null) {
    out.push({ line: 0, message: `${path}: missing body (add an IT or AND chain).` });
    return out;
  }

  if (body.kind === "it") {
    return out;
  }

  if (body.child == null) {
    out.push({
      line: body.line,
      message: `${path} (AND "${body.label}"): missing child; add a nested AND or an IT.`,
    });
    return out;
  }

  return out.concat(collectStructureErrors(body.child, `${path} > AND "${body.label}"`));
}

function validateWhenBranch(fnName: string, when: VexWhen): VexParseError[] {
  const path = `Function "${fnName}" > WHEN "${when.label}"`;
  const branchErrors: VexParseError[] = [];

  if (when.branches.length === 0) {
    branchErrors.push({ line: when.line, message: `${path}: add at least one branch (an IT or AND chain).` });
    return branchErrors;
  }

  const directIts = when.branches.filter((b) => b.kind === "it");
  if (directIts.length > 1) {
    const extra = directIts[1];
    branchErrors.push({
      line: extra.line,
      message: `${path}: a WHEN may have at most one IT at this level; use AND for additional branches.`,
    });
  }

  for (let i = 0; i < when.branches.length; i += 1) {
    const branch = when.branches[i];
    const branchPath = `${path} > branch ${String(i + 1)}`;
    const structural = collectStructureErrors(branch, branchPath);
    branchErrors.push(...structural);

    const itCount = countItNodes(branch);
    const skipZero = itCount === 0 && structural.length > 0;
    if (skipZero || itCount === 1) {
      continue;
    }

    branchErrors.push({
      line: branch.line,
      message: `${branchPath}: expected exactly one IT (found ${String(itCount)}).`,
    });
  }

  return branchErrors;
}

export function validateVexDocument(document: VexDocument): readonly VexParseError[] {
  const errors: VexParseError[] = [];
  const seenNames = new Set<string>();

  for (const fn of document.functions) {
    if (seenNames.has(fn.name)) {
      errors.push({ line: fn.line, message: `Duplicate function name "${fn.name}".` });
    }

    seenNames.add(fn.name);

    for (const when of fn.whens) {
      errors.push(...validateWhenBranch(fn.name, when));
    }
  }

  return errors;
}

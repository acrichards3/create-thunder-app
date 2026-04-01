import type { VexBody, VexDescribeBlock, VexDocument, VexParseError, VexWhen } from "./ast";

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
    out.push({ line: 0, message: `${path}: missing body (add an it or and chain).` });
    return out;
  }

  if (body.kind === "it") {
    return out;
  }

  if (body.child == null) {
    out.push({
      line: body.line,
      message: `${path} (and "${body.label}"): missing child; add a nested and or an it.`,
    });
    return out;
  }

  return out.concat(collectStructureErrors(body.child, `${path} > and "${body.label}"`));
}

function validateWhenBranch(pathPrefix: string, when: VexWhen): VexParseError[] {
  const path = `${pathPrefix} > when "${when.label}"`;
  const branchErrors: VexParseError[] = [];

  if (when.branches.length === 0) {
    branchErrors.push({ line: when.line, message: `${path}: add at least one branch (an it or and chain).` });
    return branchErrors;
  }

  const directIts = when.branches.filter((b) => b.kind === "it");
  if (directIts.length > 1) {
    const extra = directIts[1];
    branchErrors.push({
      line: extra.line,
      message: `${path}: a when may have at most one it at this level; use and for additional branches.`,
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
      message: `${branchPath}: expected exactly one it (found ${String(itCount)}).`,
    });
  }

  return branchErrors;
}

function collectDuplicateLabelsInSiblings(blocks: readonly VexDescribeBlock[], path: string): VexParseError[] {
  const seen = new Set<string>();
  const out: VexParseError[] = [];
  for (const b of blocks) {
    if (seen.has(b.label)) {
      out.push({ line: b.line, message: `${path}: duplicate describe label "${b.label}" among siblings.` });
    }
    seen.add(b.label);
  }
  return out;
}

function validateDescribeBlock(block: VexDescribeBlock, pathPrefix: string): VexParseError[] {
  const errors: VexParseError[] = [];
  const path = `${pathPrefix}describe "${block.label}"`;

  errors.push(...collectDuplicateLabelsInSiblings(block.nestedDescribes, path));

  for (const nested of block.nestedDescribes) {
    errors.push(...validateDescribeBlock(nested, `${path} > `));
  }

  for (const when of block.whens) {
    errors.push(...validateWhenBranch(path, when));
  }

  return errors;
}

export function validateVexDocument(document: VexDocument): readonly VexParseError[] {
  const errors: VexParseError[] = [];

  errors.push(...collectDuplicateLabelsInSiblings(document.describes, "Document"));

  for (const root of document.describes) {
    errors.push(...validateDescribeBlock(root, ""));
  }

  return errors;
}

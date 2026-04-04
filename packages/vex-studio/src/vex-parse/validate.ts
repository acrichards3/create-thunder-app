import { parseVexDocument } from "./list-and-document";
import type { BranchNode, DescribeBlock, ParseError, VexDocument, WhenNode } from "./types";

function countItNodes(body: BranchNode | null | undefined): number {
  if (body == null) {
    return 0;
  }
  if (body.kind === "it") {
    return 1;
  }
  return countItNodes(body.child);
}

function collectStructureErrors(body: BranchNode | null | undefined, path: string): ParseError[] {
  const out: ParseError[] = [];
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

function validateWhenBranch(pathPrefix: string, when: WhenNode): ParseError[] {
  const path = `${pathPrefix} > when "${when.label}"`;
  const branchErrors: ParseError[] = [];

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

  when.branches.forEach((branch, i) => {
    const branchPath = `${path} > branch ${String(i + 1)}`;
    const structural = collectStructureErrors(branch, branchPath);
    branchErrors.push(...structural);

    const itCount = countItNodes(branch);
    const skipZero = itCount === 0 && structural.length > 0;
    if (skipZero || itCount === 1) {
      return;
    }

    branchErrors.push({
      line: branch.line,
      message: `${branchPath}: expected exactly one it (found ${String(itCount)}).`,
    });
  });

  return branchErrors;
}

function collectDuplicateLabelsInSiblings(blocks: DescribeBlock[], path: string): ParseError[] {
  const seen = new Set<string>();
  const out: ParseError[] = [];
  blocks.forEach((b) => {
    if (seen.has(b.label)) {
      out.push({ line: b.line, message: `${path}: duplicate describe label "${b.label}" among siblings.` });
    }
    seen.add(b.label);
  });
  return out;
}

function validateDescribeBlock(block: DescribeBlock, pathPrefix: string): ParseError[] {
  const errors: ParseError[] = [];
  const path = `${pathPrefix}describe "${block.label}"`;

  errors.push(...collectDuplicateLabelsInSiblings(block.nestedDescribes, path));

  block.nestedDescribes.forEach((nested) => {
    errors.push(...validateDescribeBlock(nested, `${path} > `));
  });

  block.whens.forEach((when) => {
    errors.push(...validateWhenBranch(path, when));
  });

  return errors;
}

export function validateVexDocument(document: VexDocument): ParseError[] {
  const errors: ParseError[] = [];

  errors.push(...collectDuplicateLabelsInSiblings(document.describes, "Document"));

  document.describes.forEach((root) => {
    errors.push(...validateDescribeBlock(root, ""));
  });

  return errors;
}

export function parseAndValidateVexDocument(source: string): {
  document: VexDocument | undefined;
  errors: ParseError[];
  ok: boolean;
} {
  const parsed = parseVexDocument(source);
  if (!parsed.ok) {
    return { document: undefined, errors: parsed.errors, ok: false };
  }

  const doc = parsed.document;
  if (doc == null) {
    return {
      document: undefined,
      errors: [{ line: 0, message: "Internal parse state: document missing when ok is true." }],
      ok: false,
    };
  }

  const structuralErrors = validateVexDocument(doc);
  if (structuralErrors.length > 0) {
    return { document: undefined, errors: structuralErrors, ok: false };
  }

  return { document: doc, errors: [], ok: true };
}

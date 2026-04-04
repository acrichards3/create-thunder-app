import type { AndNode, BranchNode, DescribeBlock, ItNode, WhenNode } from "../vex-parse/types";
import { H_GAP, STUB, type SizedNode, V_GAP } from "./tree-types";
import { measureNodeCard } from "./tree-text";

function sizeIt(node: ItNode): SizedNode {
  const { h, w } = measureNodeCard(node.label);
  return {
    h,
    kids: [],
    kind: "it",
    label: node.label,
    labelSpan: node.labelSpan,
    line: node.line,
    w,
  };
}

function sizeAnd(node: AndNode): SizedNode {
  const base = measureNodeCard(node.label);
  const w = base.w;
  const h = base.h;
  if (node.child) {
    const ch = sizeBranch(node.child);
    return {
      h: h + V_GAP + ch.h,
      kids: [ch],
      kind: "and",
      label: node.label,
      labelSpan: node.labelSpan,
      line: node.line,
      w: Math.max(w, ch.w),
    };
  }
  return { h, kids: [], kind: "and", label: node.label, labelSpan: node.labelSpan, line: node.line, w };
}

function sizeBranch(branch: BranchNode): SizedNode {
  if (branch.kind === "it") {
    return sizeIt(branch);
  }
  return sizeAnd(branch);
}

function sizeWhen(node: WhenNode): SizedNode {
  const base = measureNodeCard(node.label);
  const w = base.w;
  const h = base.h;
  const kids = node.branches.map(sizeBranch);
  if (kids.length === 0) {
    return { h, kids: [], kind: "when", label: node.label, labelSpan: node.labelSpan, line: node.line, w };
  }
  if (kids.length === 1) {
    const k = kids[0];
    return {
      h: h + V_GAP + k.h,
      kids,
      kind: "when",
      label: node.label,
      labelSpan: node.labelSpan,
      line: node.line,
      w: Math.max(w, k.w),
    };
  }
  let rowW = 0;
  let rowH = 0;
  kids.forEach((kid, i) => {
    rowW += kid.w;
    rowH = Math.max(rowH, kid.h);
    if (i < kids.length - 1) {
      rowW += H_GAP;
    }
  });
  return {
    h: h + V_GAP + STUB + V_GAP + rowH,
    kids,
    kind: "when",
    label: node.label,
    labelSpan: node.labelSpan,
    line: node.line,
    w: Math.max(w, rowW),
  };
}

export function sizeDescribe(block: DescribeBlock): SizedNode {
  const base = measureNodeCard(block.label);
  const w = base.w;
  const h = base.h;
  const kids: SizedNode[] = [];
  block.nestedDescribes.forEach((nested) => {
    kids.push(sizeDescribe(nested));
  });
  block.whens.forEach((when) => {
    kids.push(sizeWhen(when));
  });
  if (kids.length === 0) {
    return { h, kids: [], kind: "describe", label: block.label, labelSpan: block.labelSpan, line: block.line, w };
  }
  if (kids.length === 1) {
    const kk = kids[0];
    return {
      h: h + V_GAP + kk.h,
      kids,
      kind: "describe",
      label: block.label,
      labelSpan: block.labelSpan,
      line: block.line,
      w: Math.max(w, kk.w),
    };
  }
  let rw = 0;
  let rh = 0;
  kids.forEach((kid, m) => {
    rw += kid.w;
    rh = Math.max(rh, kid.h);
    if (m < kids.length - 1) {
      rw += H_GAP;
    }
  });
  return {
    h: h + V_GAP + STUB + V_GAP + rh,
    kids,
    kind: "describe",
    label: block.label,
    labelSpan: block.labelSpan,
    line: block.line,
    w: Math.max(w, rw),
  };
}

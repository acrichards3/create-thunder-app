import {
  parseDescribeHeaderFromLine,
  parseDescribeLabelSpanInContent,
  peekStack,
  popDeeperThan,
  popSiblingDescribesAtIndent,
  pushError,
} from "./stack-and-lines";
import type {
  AndNode,
  DescribeBlock,
  ItNode,
  LabelSpan,
  ParseContext,
  StackFrame,
  StackFrameAnd,
  StackFrameDescribe,
  StackFrameIt,
  StackFrameWhen,
  WhenNode,
} from "./types";

type DescribeInput = {
  content: string;
  ctx: ParseContext;
  leadingSpaces: number;
  lineNo: number;
  lineStartOffset: number;
};

type WhenInput = {
  ctx: ParseContext;
  label: string;
  labelSpan: LabelSpan;
  leadingSpaces: number;
  lineNo: number;
  parent: StackFrame | null;
};

type AndItInput = {
  ctx: ParseContext;
  label: string;
  labelSpan: LabelSpan;
  leadingSpaces: number;
  lineNo: number;
  parent: StackFrame | null;
};

export function processDescribeDeclarationLine(input: DescribeInput): void {
  const { content, ctx, leadingSpaces, lineNo, lineStartOffset } = input;
  const { label } = parseDescribeHeaderFromLine(content);
  if (label == null) {
    pushError(ctx, lineNo, 'Expected a line like "describe: Label" (describe may be upper or lower case).');
    return;
  }

  const spanParsed = parseDescribeLabelSpanInContent(content);
  if (spanParsed.span == null) {
    pushError(ctx, lineNo, "Could not locate describe label text in this line.");
    return;
  }

  const spanLocal = spanParsed.span;
  const labelSpan: LabelSpan = {
    end: lineStartOffset + leadingSpaces + spanLocal.end,
    start: lineStartOffset + leadingSpaces + spanLocal.start,
  };

  popDeeperThan(ctx.stack, leadingSpaces);
  popSiblingDescribesAtIndent(ctx.stack, leadingSpaces);

  const block: DescribeBlock = { label, labelSpan, line: lineNo, nestedDescribes: [], whens: [] };

  if (leadingSpaces === 0) {
    ctx.document.describes.push(block);
    ctx.stack.length = 0;
    const frame: StackFrameDescribe = { indent: 0, kind: "describe", node: block };
    ctx.stack.push(frame);
    return;
  }

  const { parent } = peekStack(ctx.stack);
  if (parent == null || parent.kind !== "describe") {
    pushError(ctx, lineNo, "Nested describe must be indented under a describe block.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "describe must be indented one level (4 spaces) deeper than its parent describe.");
    return;
  }

  parent.node.nestedDescribes.push(block);
  const frame: StackFrameDescribe = { indent: leadingSpaces, kind: "describe", node: block };
  ctx.stack.push(frame);
}

export function processWhenLine(input: WhenInput): void {
  const { ctx, label, labelSpan, leadingSpaces, lineNo, parent } = input;
  if (parent == null || parent.kind !== "describe") {
    pushError(ctx, lineNo, "when must appear directly under a describe block (4 spaces under the describe line).");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "when must be indented 4 spaces under its parent describe.");
    return;
  }

  const whenNode: WhenNode = { branches: [], label, labelSpan, line: lineNo };
  parent.node.whens.push(whenNode);
  const frame: StackFrameWhen = { indent: leadingSpaces, kind: "when", node: whenNode };
  ctx.stack.push(frame);
}

export function processAndLine(input: AndItInput): void {
  const { ctx, label, labelSpan, leadingSpaces, lineNo, parent } = input;
  if (parent == null) {
    pushError(ctx, lineNo, "and must appear under a when or another and.");
    return;
  }

  if (parent.kind === "describe" || parent.kind === "it") {
    pushError(ctx, lineNo, "and must appear under a when or another and.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "and must be indented one level (4 spaces) deeper than its parent.");
    return;
  }

  if (parent.kind === "when") {
    const and: AndNode = { child: undefined, kind: "and", label, labelSpan, line: lineNo };
    parent.node.branches.push(and);
    const frame: StackFrameAnd = { indent: leadingSpaces, kind: "and", node: and };
    ctx.stack.push(frame);
    return;
  }

  if (parent.node.child != null) {
    pushError(ctx, lineNo, "This and already has a child; use a nested and for deeper branches.");
    return;
  }

  const and: AndNode = { child: undefined, kind: "and", label, labelSpan, line: lineNo };
  parent.node.child = and;
  const frame: StackFrameAnd = { indent: leadingSpaces, kind: "and", node: and };
  ctx.stack.push(frame);
}

export function processItLine(input: AndItInput): void {
  const { ctx, label, labelSpan, leadingSpaces, lineNo, parent } = input;
  const it: ItNode = { kind: "it", label, labelSpan, line: lineNo };

  if (parent == null) {
    pushError(ctx, lineNo, "it must appear under a when or and.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx, lineNo, "it must be indented one level (4 spaces) deeper than its parent.");
    return;
  }

  if (parent.kind === "describe") {
    pushError(ctx, lineNo, "it must appear under a when or and, not directly under a describe.");
    return;
  }

  if (parent.kind === "when") {
    parent.node.branches.push(it);
    const frame: StackFrameIt = { indent: leadingSpaces, kind: "it", node: it };
    ctx.stack.push(frame);
    return;
  }

  if (parent.kind === "and") {
    if (parent.node.child != null) {
      pushError(ctx, lineNo, "This and already has a child.");
      return;
    }

    parent.node.child = it;
    const frame: StackFrameIt = { indent: leadingSpaces, kind: "it", node: it };
    ctx.stack.push(frame);
    return;
  }

  pushError(ctx, lineNo, "it cannot appear nested under another it.");
}

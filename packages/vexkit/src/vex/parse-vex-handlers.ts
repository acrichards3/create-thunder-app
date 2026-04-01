import type { VexAnd, VexDescribeBlock, VexDocument, VexIt, VexParseError, VexWhen } from "./ast";
import { countLeadingSpaces, parseDescribeHeaderFromLine, parseListLineParts } from "./parse-vex-line";
import type { StackEntry } from "./parse-vex-stack";
import { peekStack, popDeeperThan, popSiblingDescribesAtIndent, popStackForListLine } from "./parse-vex-stack";

export type ParseContext = {
  document: VexDocument;
  errors: VexParseError[];
  stack: StackEntry[];
};

function pushError(errors: VexParseError[], line: number, message: string): void {
  errors.push({ line, message });
}

function processDescribeDeclarationLine(input: {
  content: string;
  ctx: ParseContext;
  leadingSpaces: number;
  lineNo: number;
}): void {
  const { content, ctx, leadingSpaces, lineNo } = input;
  const { label } = parseDescribeHeaderFromLine(content);
  if (label == null) {
    pushError(ctx.errors, lineNo, 'Expected a line like "describe: Label" (describe may be upper or lower case).');
    return;
  }

  popDeeperThan(ctx.stack, leadingSpaces);
  popSiblingDescribesAtIndent(ctx.stack, leadingSpaces);

  const block: VexDescribeBlock = { label, line: lineNo, nestedDescribes: [], whens: [] };

  if (leadingSpaces === 0) {
    ctx.document.describes.push(block);
    ctx.stack.length = 0;
    ctx.stack.push({ indent: 0, kind: "describe", node: block });
    return;
  }

  const { parent } = peekStack(ctx.stack);
  if (parent == null || parent.kind !== "describe") {
    pushError(ctx.errors, lineNo, "Nested describe must be indented under a describe block.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx.errors, lineNo, "describe must be indented one level (4 spaces) deeper than its parent describe.");
    return;
  }

  parent.node.nestedDescribes.push(block);
  ctx.stack.push({ indent: leadingSpaces, kind: "describe", node: block });
}

function processWhenLine(input: {
  ctx: ParseContext;
  label: string;
  leadingSpaces: number;
  lineNo: number;
  parent: StackEntry | null;
}): void {
  const { ctx, label, leadingSpaces, lineNo, parent } = input;
  if (parent == null || parent.kind !== "describe") {
    pushError(
      ctx.errors,
      lineNo,
      "when must appear directly under a describe block (4 spaces under the describe line).",
    );
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx.errors, lineNo, "when must be indented 4 spaces under its parent describe.");
    return;
  }

  const whenNode: VexWhen = { branches: [], label, line: lineNo };
  parent.node.whens.push(whenNode);
  ctx.stack.push({ indent: leadingSpaces, kind: "when", node: whenNode });
}

function processAndLine(input: {
  ctx: ParseContext;
  label: string;
  leadingSpaces: number;
  lineNo: number;
  parent: StackEntry | null;
}): void {
  const { ctx, label, leadingSpaces, lineNo, parent } = input;
  if (parent == null) {
    pushError(ctx.errors, lineNo, "and must appear under a when or another and.");
    return;
  }

  if (parent.kind === "describe" || parent.kind === "it") {
    pushError(ctx.errors, lineNo, "and must appear under a when or another and.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx.errors, lineNo, "and must be indented one level (4 spaces) deeper than its parent.");
    return;
  }

  if (parent.kind === "when") {
    const and: VexAnd = { child: undefined, kind: "and", label, line: lineNo };
    parent.node.branches.push(and);
    ctx.stack.push({ indent: leadingSpaces, kind: "and", node: and });
    return;
  }

  if (parent.node.child != null) {
    pushError(ctx.errors, lineNo, "This and already has a child; use a nested and for deeper branches.");
    return;
  }

  const and: VexAnd = { child: undefined, kind: "and", label, line: lineNo };
  parent.node.child = and;
  ctx.stack.push({ indent: leadingSpaces, kind: "and", node: and });
}

function processItLine(input: {
  ctx: ParseContext;
  label: string;
  leadingSpaces: number;
  lineNo: number;
  parent: StackEntry | null;
}): void {
  const { ctx, label, leadingSpaces, lineNo, parent } = input;
  const it: VexIt = { kind: "it", label, line: lineNo };

  if (parent == null) {
    pushError(ctx.errors, lineNo, "it must appear under a when or and.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx.errors, lineNo, "it must be indented one level (4 spaces) deeper than its parent.");
    return;
  }

  if (parent.kind === "describe") {
    pushError(ctx.errors, lineNo, "it must appear under a when or and, not directly under a describe.");
    return;
  }

  if (parent.kind === "when") {
    parent.node.branches.push(it);
    ctx.stack.push({ indent: leadingSpaces, kind: "it", node: it });
    return;
  }

  if (parent.kind === "and") {
    if (parent.node.child != null) {
      pushError(ctx.errors, lineNo, "This and already has a child.");
      return;
    }

    parent.node.child = it;
    ctx.stack.push({ indent: leadingSpaces, kind: "it", node: it });
    return;
  }

  pushError(ctx.errors, lineNo, "it cannot appear nested under another it.");
}

function processListLine(input: { content: string; ctx: ParseContext; leadingSpaces: number; lineNo: number }): void {
  const { content, ctx, leadingSpaces, lineNo } = input;
  const { keyword, label } = parseListLineParts(content);
  if (keyword == null) {
    pushError(ctx.errors, lineNo, 'Expected a line starting with "when:", "and:", or "it:" (case-insensitive).');
    return;
  }

  if (label === "") {
    pushError(ctx.errors, lineNo, "Missing text after the colon; add a non-empty label.");
    return;
  }

  const popped = popStackForListLine(
    ctx.stack,
    leadingSpaces,
    keyword,
    (line, message) => {
      pushError(ctx.errors, line, message);
    },
    lineNo,
  );
  if (!popped) {
    return;
  }

  const { parent } = peekStack(ctx.stack);

  if (keyword === "WHEN") {
    processWhenLine({ ctx, label, leadingSpaces, lineNo, parent });
    return;
  }

  if (keyword === "AND") {
    processAndLine({ ctx, label, leadingSpaces, lineNo, parent });
    return;
  }

  processItLine({ ctx, label, leadingSpaces, lineNo, parent });
}

export function processVexLine(input: { ctx: ParseContext; line: { lineNo: number; rawLine: string } }): void {
  const { ctx, line } = input;
  const { lineNo, rawLine } = line;
  if (rawLine.trim() === "") {
    return;
  }

  if (rawLine.includes("\t")) {
    pushError(ctx.errors, lineNo, "Tabs are not allowed; use spaces for indentation.");
    return;
  }

  const leadingSpaces = countLeadingSpaces(rawLine);
  const content = rawLine.slice(leadingSpaces);

  if (leadingSpaces !== 0 && leadingSpaces % 4 !== 0) {
    pushError(ctx.errors, lineNo, "Indentation must use a multiple of 4 spaces.");
    return;
  }

  const { keyword } = parseListLineParts(content);
  if (keyword != null) {
    if (leadingSpaces === 0) {
      pushError(
        ctx.errors,
        lineNo,
        "when, and, it lines must be indented under a describe block (multiples of 4 spaces).",
      );
      return;
    }

    if (leadingSpaces < 4) {
      pushError(ctx.errors, lineNo, "The first when under a describe must be indented with at least 4 spaces.");
      return;
    }

    processListLine({ content, ctx, leadingSpaces, lineNo });
    return;
  }

  const { label: describeLabel } = parseDescribeHeaderFromLine(content);
  if (describeLabel != null) {
    processDescribeDeclarationLine({ content, ctx, leadingSpaces, lineNo });
    return;
  }

  if (leadingSpaces === 0) {
    pushError(ctx.errors, lineNo, 'Expected a top-level line starting with "describe:".');
    return;
  }

  pushError(
    ctx.errors,
    lineNo,
    'Expected a line starting with "describe:", "when:", "and:", or "it:" (case-insensitive) at the correct indent.',
  );
}

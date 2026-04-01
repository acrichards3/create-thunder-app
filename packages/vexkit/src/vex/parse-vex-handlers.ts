import type { VexAnd, VexDocument, VexFunction, VexIt, VexParseError, VexWhen } from "./ast";
import { countLeadingSpaces, parseFunctionHeaderFromLine, parseListLineParts } from "./parse-vex-line";
import type { StackEntry } from "./parse-vex-stack";
import { peekStack, popStackForListLine } from "./parse-vex-stack";

export type ParseContext = {
  document: VexDocument;
  errors: VexParseError[];
  stack: StackEntry[];
};

const RESERVED_FUNCTION_NAMES = new Set(["AND", "IT", "WHEN"]);

function pushError(errors: VexParseError[], line: number, message: string): void {
  errors.push({ line, message });
}

function processFunctionDeclarationLine(input: {
  content: string;
  ctx: ParseContext;
  leadingSpaces: number;
  lineNo: number;
}): void {
  const { content, ctx, leadingSpaces, lineNo } = input;
  if (leadingSpaces !== 0) {
    pushError(ctx.errors, lineNo, "Function names must start at column 0.");
    return;
  }

  const { description, name } = parseFunctionHeaderFromLine(content);
  if (name == null) {
    pushError(ctx.errors, lineNo, 'Expected a function line like "myFunction:" or "myFunction: optional description".');
    return;
  }

  if (RESERVED_FUNCTION_NAMES.has(name)) {
    pushError(ctx.errors, lineNo, "WHEN, AND, and IT are reserved; indent those lines under a function.");
    return;
  }

  ctx.stack.length = 0;
  const fn: VexFunction = { description, line: lineNo, name, whens: [] };
  ctx.document.functions.push(fn);
  ctx.stack.push({ indent: 0, kind: "function", node: fn });
}

function processWhenLine(input: {
  ctx: ParseContext;
  label: string;
  leadingSpaces: number;
  lineNo: number;
  parent: StackEntry | null;
}): void {
  const { ctx, label, leadingSpaces, lineNo, parent } = input;
  if (parent == null || parent.kind !== "function") {
    pushError(ctx.errors, lineNo, "WHEN must appear directly under a function (4 spaces under the function line).");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx.errors, lineNo, "WHEN must be indented 4 spaces under the function name.");
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
    pushError(ctx.errors, lineNo, "AND must appear under a WHEN or another AND.");
    return;
  }

  if (parent.kind === "function" || parent.kind === "it") {
    pushError(ctx.errors, lineNo, "AND must appear under a WHEN or another AND.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx.errors, lineNo, "AND must be indented one level (4 spaces) deeper than its parent.");
    return;
  }

  if (parent.kind === "when") {
    const and: VexAnd = { child: undefined, kind: "and", label, line: lineNo };
    parent.node.branches.push(and);
    ctx.stack.push({ indent: leadingSpaces, kind: "and", node: and });
    return;
  }

  if (parent.node.child != null) {
    pushError(ctx.errors, lineNo, "This AND already has a child; use a nested AND for deeper branches.");
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
    pushError(ctx.errors, lineNo, "IT must appear under a WHEN or AND.");
    return;
  }

  if (leadingSpaces !== parent.indent + 4) {
    pushError(ctx.errors, lineNo, "IT must be indented one level (4 spaces) deeper than its parent.");
    return;
  }

  if (parent.kind === "function") {
    pushError(ctx.errors, lineNo, "IT must appear under a WHEN or AND, not directly under a function.");
    return;
  }

  if (parent.kind === "when") {
    parent.node.branches.push(it);
    ctx.stack.push({ indent: leadingSpaces, kind: "it", node: it });
    return;
  }

  if (parent.kind === "and") {
    if (parent.node.child != null) {
      pushError(ctx.errors, lineNo, "This AND already has a child.");
      return;
    }

    parent.node.child = it;
    ctx.stack.push({ indent: leadingSpaces, kind: "it", node: it });
    return;
  }

  pushError(ctx.errors, lineNo, "IT cannot appear nested under another IT.");
}

function processListLine(input: { content: string; ctx: ParseContext; leadingSpaces: number; lineNo: number }): void {
  const { content, ctx, leadingSpaces, lineNo } = input;
  const { keyword, label } = parseListLineParts(content);
  if (keyword == null) {
    pushError(ctx.errors, lineNo, 'Expected a line starting with "WHEN:", "AND:", or "IT:".');
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
        "WHEN, AND, and IT lines must be indented under a function (multiples of 4 spaces).",
      );
      return;
    }

    if (leadingSpaces < 4) {
      pushError(ctx.errors, lineNo, "The first WHEN under a function must be indented with at least 4 spaces.");
      return;
    }

    processListLine({ content, ctx, leadingSpaces, lineNo });
    return;
  }

  if (leadingSpaces !== 0) {
    pushError(ctx.errors, lineNo, 'Expected a line starting with "WHEN:", "AND:", or "IT:" at the correct indent.');
    return;
  }

  processFunctionDeclarationLine({ content, ctx, leadingSpaces, lineNo });
}

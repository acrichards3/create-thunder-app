import type { ParseContext, StackFrame } from "./types";

export function countLeadingSpaces(rawLine: string): number {
  const match = /^ */u.exec(rawLine);
  return match?.[0].length ?? 0;
}

export function parseDescribeHeaderFromLine(content: string): { label: null | string } {
  const trimmed = content.trimStart();
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith("describe")) {
    return { label: null };
  }
  const afterKeyword = trimmed.slice(8).trimStart();
  if (!afterKeyword.startsWith(":")) {
    return { label: null };
  }
  const label = afterKeyword.slice(1).trim();
  return { label: label.length > 0 ? label : null };
}

export function labelAfterKeywordPrefix(trimmed: string, keywordLen: number): [boolean, string] {
  const after = trimmed.slice(keywordLen).trimStart();
  if (!after.startsWith(":")) {
    return [false, ""];
  }
  return [true, after.slice(1).trim()];
}

export type LabelSpanInLine = {
  end: number;
  start: number;
};

export type LabelSpanParseResult = { span: LabelSpanInLine | null };

function parseLabelSpanWithPattern(content: string, pattern: RegExp): LabelSpanParseResult {
  const trimmed = content.trimStart();
  const m = pattern.exec(trimmed);
  if (m == null) {
    return { span: null };
  }
  const rest = trimmed.slice(m[0].length);
  const prefixOffset = content.length - trimmed.length;
  const startInTrimmed = m[0].length + (rest.length - rest.trimStart().length);
  const endInTrimmed = m[0].length + rest.trimEnd().length;
  return {
    span: {
      end: prefixOffset + endInTrimmed,
      start: prefixOffset + startInTrimmed,
    },
  };
}

const DESCRIBE_LABEL_PATTERN = /^describe\s*:\s*/iu;
const LIST_LABEL_PATTERN = /^(when|and|it)\s*:\s*/iu;

export function parseDescribeLabelSpanInContent(content: string): LabelSpanParseResult {
  return parseLabelSpanWithPattern(content, DESCRIBE_LABEL_PATTERN);
}

export function parseListLabelSpanInContent(content: string): LabelSpanParseResult {
  return parseLabelSpanWithPattern(content, LIST_LABEL_PATTERN);
}

export function parseListLineParts(content: string): { keyword: null | string; label: string } {
  const trimmed = content.trimStart();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("when")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 4);
    if (ok) {
      return { keyword: "WHEN", label };
    }
  }
  if (lower.startsWith("and")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 3);
    if (ok) {
      return { keyword: "AND", label };
    }
  }
  if (lower.startsWith("it")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 2);
    if (ok) {
      return { keyword: "IT", label };
    }
  }
  return { keyword: null, label: "" };
}

export function popDeeperThan(stack: StackFrame[], leadingSpaces: number): void {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent <= leadingSpaces) {
      break;
    }
    stack.pop();
  }
}

export function popSiblingDescribesAtIndent(stack: StackFrame[], describeIndent: number): void {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent !== describeIndent) {
      break;
    }
    if (top.kind !== "describe") {
      break;
    }
    stack.pop();
  }
}

export function popWhenSiblingsAtIndent(stack: StackFrame[], whenIndent: number): void {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent !== whenIndent) {
      break;
    }
    if (top.kind !== "when") {
      break;
    }
    stack.pop();
  }
}

export function popCompletedListSiblingsAtIndent(
  stack: StackFrame[],
  leadingSpaces: number,
  onError: (line: number, message: string) => void,
  lineNo: number,
): boolean {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }
    if (top.indent !== leadingSpaces) {
      break;
    }
    if (top.kind === "it") {
      stack.pop();
      continue;
    }
    if (top.kind === "and") {
      if (top.node.child == null) {
        onError(lineNo, "Complete this AND with a nested AND or IT before a sibling branch at the same indent.");
        return false;
      }
      stack.pop();
      continue;
    }
    break;
  }
  return true;
}

export function popStackForListLine(
  stack: StackFrame[],
  leadingSpaces: number,
  keyword: string,
  onError: (line: number, message: string) => void,
  lineNo: number,
): boolean {
  popDeeperThan(stack, leadingSpaces);
  if (keyword === "WHEN") {
    popWhenSiblingsAtIndent(stack, leadingSpaces);
    return true;
  }
  return popCompletedListSiblingsAtIndent(stack, leadingSpaces, onError, lineNo);
}

export function peekStack(stack: StackFrame[]): { parent: StackFrame | null } {
  const parent = stack.at(-1);
  if (parent == null) {
    return { parent: null };
  }
  return { parent };
}

export function pushError(ctx: ParseContext, line: number, message: string): void {
  ctx.errors.push({ line, message });
}

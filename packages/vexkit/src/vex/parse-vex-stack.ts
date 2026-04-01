import type { ListKeyword } from "./parse-vex-line";
import type { VexAnd, VexFunction, VexIt, VexWhen } from "./ast";

export type StackEntry =
  | { indent: number; kind: "and"; node: VexAnd }
  | { indent: number; kind: "function"; node: VexFunction }
  | { indent: number; kind: "it"; node: VexIt }
  | { indent: number; kind: "when"; node: VexWhen };

function popDeeperThan(stack: StackEntry[], leadingSpaces: number): void {
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

function popWhenSiblingsAtIndent4(stack: StackEntry[]): void {
  while (stack.length > 0) {
    const top = stack.at(-1);
    if (top == null) {
      break;
    }

    if (top.indent !== 4) {
      break;
    }

    if (top.kind !== "when") {
      break;
    }

    stack.pop();
  }
}

function popCompletedListSiblingsAtIndent(
  stack: StackEntry[],
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
  stack: StackEntry[],
  leadingSpaces: number,
  keyword: ListKeyword,
  onError: (line: number, message: string) => void,
  lineNo: number,
): boolean {
  popDeeperThan(stack, leadingSpaces);

  if (keyword === "WHEN" && leadingSpaces === 4) {
    popWhenSiblingsAtIndent4(stack);
    return true;
  }

  return popCompletedListSiblingsAtIndent(stack, leadingSpaces, onError, lineNo);
}

export function peekStack(stack: StackEntry[]): { parent: StackEntry | null } {
  const parent = stack.at(-1);
  if (parent == null) {
    return { parent: null };
  }

  return { parent };
}

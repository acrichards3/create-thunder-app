import ts from "typescript";
import type { SpecStep } from "./spec-step-shape";

function stringFromArg(arg: ts.Expression | undefined): string {
  if (arg == null) {
    return "";
  }
  if (ts.isStringLiteral(arg)) {
    return arg.text;
  }
  if (ts.isNoSubstitutionTemplateLiteral(arg)) {
    return arg.text;
  }
  return "";
}

function blockFromArrow(fn: ts.ArrowFunction): { block: ts.Block | null } {
  const b = fn.body;
  if (ts.isBlock(b)) {
    return { block: b };
  }
  return { block: null };
}

function callbackBlock(expr: ts.Expression | undefined): { block: ts.Block | null } {
  if (expr == null) {
    return { block: null };
  }
  if (ts.isArrowFunction(expr)) {
    return blockFromArrow(expr);
  }
  if (ts.isFunctionExpression(expr)) {
    return { block: expr.body };
  }
  return { block: null };
}

function itCallTitle(expression: ts.Expression): string {
  if (!ts.isCallExpression(expression)) {
    return "";
  }
  const callee = expression.expression;
  if (ts.isIdentifier(callee) && callee.text === "it") {
    return stringFromArg(expression.arguments[0]);
  }
  if (
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "todo" &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === "it"
  ) {
    return stringFromArg(expression.arguments[0]);
  }
  return "";
}

function pushDescribeBranch(ex: ts.CallExpression, acc: SpecStep[]): void {
  const dTitle = stringFromArg(ex.arguments[0]);
  if (dTitle.length === 0) {
    return;
  }
  if (dTitle.startsWith("WHEN ")) {
    acc.push({ key: dTitle, tag: "when" });
  } else if (dTitle.startsWith("AND ")) {
    acc.push({ key: dTitle, tag: "and" });
  }
  const inner = callbackBlock(ex.arguments[1]);
  if (inner.block != null) {
    walkBlock(inner.block, acc);
  }
}

function walkStatement(stmt: ts.Statement, acc: SpecStep[]): void {
  if (!ts.isExpressionStatement(stmt)) {
    return;
  }
  const ex = stmt.expression;
  const itTitle = itCallTitle(ex);
  if (itTitle.length > 0) {
    acc.push({ key: itTitle, tag: "it" });
    return;
  }
  if (!ts.isCallExpression(ex)) {
    return;
  }
  if (!ts.isIdentifier(ex.expression) || ex.expression.text !== "describe") {
    return;
  }
  pushDescribeBranch(ex, acc);
}

function walkBlock(block: ts.Block, acc: SpecStep[]): void {
  for (const stmt of block.statements) {
    walkStatement(stmt, acc);
  }
}

export function extractSpecStepsFromSource(
  source: string,
  functionName: string,
): { errorMessage: string; steps: SpecStep[] } {
  const file = ts.createSourceFile("spec.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const slot = { block: null as ts.Block | null };

  const visit = (node: ts.Node): void => {
    if (slot.block != null) {
      return;
    }
    if (!ts.isCallExpression(node)) {
      ts.forEachChild(node, visit);
      return;
    }
    if (!ts.isIdentifier(node.expression) || node.expression.text !== "describe") {
      ts.forEachChild(node, visit);
      return;
    }
    const title = stringFromArg(node.arguments[0]);
    if (title !== functionName) {
      ts.forEachChild(node, visit);
      return;
    }
    const bodyWrap = callbackBlock(node.arguments[1]);
    if (bodyWrap.block == null) {
      ts.forEachChild(node, visit);
      return;
    }
    slot.block = bodyWrap.block;
  };

  visit(file);

  if (slot.block == null) {
    return {
      errorMessage: `No describe("${functionName}", …) with a block body was found.`,
      steps: [],
    };
  }

  const acc: SpecStep[] = [];
  walkBlock(slot.block, acc);
  return { errorMessage: "", steps: acc };
}

import ts from "typescript";

export function specSourceContainsItTodo(source: string): boolean {
  const file = ts.createSourceFile("spec.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found = false;

  const visit = (node: ts.Node): void => {
    if (found) {
      return;
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const pa = node.expression;
      if (pa.name.text === "todo" && ts.isIdentifier(pa.expression) && pa.expression.text === "it") {
        found = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(file);
  return found;
}

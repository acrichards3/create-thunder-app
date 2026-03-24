import type { VexBody, VexDocument, VexWhen } from "../vex/ast";

function pad(n: number): string {
  return " ".repeat(n);
}

function emitBody(body: VexBody, depth: number): string[] {
  if (body.kind === "it") {
    const line = `${pad(depth)}it.todo(${JSON.stringify(body.label)}, () => {});`;
    return [line];
  }
  const andKey = `AND ${body.label}`;
  const head = `${pad(depth)}describe(${JSON.stringify(andKey)}, () => {`;
  const lines = [head];
  if (body.child != null) {
    lines.push(...emitBody(body.child, depth + 2));
  }
  lines.push(`${pad(depth)}});`);
  return lines;
}

function emitWhen(w: VexWhen, depth: number): string[] {
  const whenKey = `WHEN ${w.label}`;
  const head = `${pad(depth)}describe(${JSON.stringify(whenKey)}, () => {`;
  const lines = [head];
  const inner = depth + 2;
  for (const b of w.branches) {
    lines.push(...emitBody(b, inner));
  }
  lines.push(`${pad(depth)}});`);
  return lines;
}

export function generateSpecTsFromVexDocument(doc: VexDocument): string {
  const chunks: string[] = ['import { describe, it } from "bun:test";\n'];
  for (const fn of doc.functions) {
    chunks.push(`\ndescribe(${JSON.stringify(fn.name)}, () => {\n`);
    for (const w of fn.whens) {
      chunks.push(`${emitWhen(w, 2).join("\n")}\n`);
    }
    chunks.push(`});\n`);
  }
  return chunks.join("");
}

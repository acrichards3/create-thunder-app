import type { VexBody, VexDescribeBlock, VexDocument, VexWhen } from "../vex/ast";

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

function emitDescribeBlock(block: VexDescribeBlock, depth: number): string[] {
  const head = `${pad(depth)}describe(${JSON.stringify(block.label)}, () => {`;
  const lines = [head];
  const inner = depth + 2;
  for (const nested of block.nestedDescribes) {
    lines.push(...emitDescribeBlock(nested, inner));
  }
  for (const w of block.whens) {
    lines.push(...emitWhen(w, inner));
  }
  lines.push(`${pad(depth)}});`);
  return lines;
}

export function generateSpecTsFromVexDocument(doc: VexDocument): string {
  const chunks: string[] = ['import { describe, it } from "bun:test";\n'];
  for (const root of doc.describes) {
    chunks.push(`\n${emitDescribeBlock(root, 0).join("\n")}\n`);
  }
  return chunks.join("");
}

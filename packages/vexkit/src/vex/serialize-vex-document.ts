import type { VexBody, VexDescribeBlock, VexDocument, VexWhen } from "./ast";

function serializeBody(body: VexBody, indent: number): string[] {
  const pad = " ".repeat(indent);
  if (body.kind === "it") {
    return [`${pad}it: ${body.label}`];
  }
  const lines = [`${pad}and: ${body.label}`];
  if (body.child != null) {
    lines.push(...serializeBody(body.child, indent + 4));
  }
  return lines;
}

function serializeWhen(w: VexWhen, indent: number): string[] {
  const pad = " ".repeat(indent);
  const lines = [`${pad}when: ${w.label}`];
  const childIndent = indent + 4;
  for (const b of w.branches) {
    lines.push(...serializeBody(b, childIndent));
  }
  return lines;
}

function serializeDescribeBlock(block: VexDescribeBlock, indent: number): string[] {
  const pad = " ".repeat(indent);
  const lines = [`${pad}describe: ${block.label}`];
  const inner = indent + 4;
  for (const nested of block.nestedDescribes) {
    lines.push(...serializeDescribeBlock(nested, inner));
  }
  for (const w of block.whens) {
    lines.push(...serializeWhen(w, inner));
  }
  return lines;
}

export function serializeVexDocument(doc: VexDocument): string {
  const blocks = doc.describes.map((root) => serializeDescribeBlock(root, 0).join("\n"));
  return `${blocks.join("\n\n")}\n`;
}

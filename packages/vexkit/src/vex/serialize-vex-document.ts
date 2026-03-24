import type { VexBody, VexDocument, VexWhen } from "./ast";

function serializeBody(body: VexBody, indent: number): string[] {
  const pad = " ".repeat(indent);
  if (body.kind === "it") {
    return [`${pad}- IT: ${body.label}`];
  }
  const lines = [`${pad}- AND: ${body.label}`];
  if (body.child != null) {
    lines.push(...serializeBody(body.child, indent + 2));
  }
  return lines;
}

function serializeWhen(w: VexWhen, indent: number): string[] {
  const pad = " ".repeat(indent);
  const lines = [`${pad}- WHEN: ${w.label}`];
  const childIndent = indent + 2;
  for (const b of w.branches) {
    lines.push(...serializeBody(b, childIndent));
  }
  return lines;
}

export function serializeVexDocument(doc: VexDocument): string {
  const blocks = doc.functions.map((fn) => {
    const lines = [`${fn.name}:`];
    for (const w of fn.whens) {
      lines.push(...serializeWhen(w, 2));
    }
    return lines.join("\n");
  });
  return `${blocks.join("\n\n")}\n`;
}

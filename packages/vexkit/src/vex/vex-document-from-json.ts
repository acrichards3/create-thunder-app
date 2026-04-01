import type { VexAnd, VexBody, VexDescribeBlock, VexDocument, VexIt, VexWhen } from "./ast";

function isRecord(v: unknown): { record: Record<string, unknown> | null } {
  if (typeof v !== "object") {
    return { record: null };
  }
  if (v === null) {
    return { record: null };
  }
  return { record: Object.fromEntries(Object.entries(v)) };
}

function lineFromUnknown(v: unknown): { line: number | null } {
  if (typeof v !== "number") {
    return { line: null };
  }
  if (!Number.isFinite(v)) {
    return { line: null };
  }
  if (v < 1) {
    return { line: null };
  }
  return { line: Math.floor(v) };
}

function nameFromUnknown(v: unknown): { name: string | null } {
  if (typeof v !== "string") {
    return { name: null };
  }
  if (v.length === 0) {
    return { name: null };
  }
  return { name: v };
}

function vexItFromUnknown(data: unknown): { it: VexIt | null } {
  const rec = isRecord(data);
  if (rec.record == null) {
    return { it: null };
  }
  if (rec.record.kind !== "it") {
    return { it: null };
  }
  const { name: label } = nameFromUnknown(rec.record.label);
  const { line } = lineFromUnknown(rec.record.line);
  if (label == null) {
    return { it: null };
  }
  if (line == null) {
    return { it: null };
  }
  return { it: { kind: "it", label, line } };
}

function vexAndFromUnknown(data: unknown): { and: VexAnd | null } {
  const rec = isRecord(data);
  if (rec.record == null) {
    return { and: null };
  }
  if (rec.record.kind !== "and") {
    return { and: null };
  }
  const { name: label } = nameFromUnknown(rec.record.label);
  const { line } = lineFromUnknown(rec.record.line);
  if (label == null) {
    return { and: null };
  }
  if (line == null) {
    return { and: null };
  }
  let child: VexBody | undefined;
  if (rec.record.child != null) {
    const c = vexBodyFromUnknown(rec.record.child);
    if (c.body == null) {
      return { and: null };
    }
    child = c.body;
  }
  return { and: { child, kind: "and", label, line } };
}

function vexBodyFromUnknown(data: unknown): { body: VexBody | null } {
  const rec = isRecord(data);
  if (rec.record == null) {
    return { body: null };
  }
  if (rec.record.kind === "it") {
    const r = vexItFromUnknown(data);
    return { body: r.it };
  }
  if (rec.record.kind === "and") {
    const r = vexAndFromUnknown(data);
    return { body: r.and };
  }
  return { body: null };
}

function vexWhenFromUnknown(data: unknown): { when: VexWhen | null } {
  const rec = isRecord(data);
  if (rec.record == null) {
    return { when: null };
  }
  const { name: label } = nameFromUnknown(rec.record.label);
  const { line } = lineFromUnknown(rec.record.line);
  if (label == null) {
    return { when: null };
  }
  if (line == null) {
    return { when: null };
  }
  const branchesRaw = rec.record.branches;
  if (!Array.isArray(branchesRaw)) {
    return { when: null };
  }
  const branches: VexBody[] = [];
  for (const b of branchesRaw) {
    const body = vexBodyFromUnknown(b);
    if (body.body == null) {
      return { when: null };
    }
    branches.push(body.body);
  }
  return { when: { branches, label, line } };
}

function vexDescribeBlockFromUnknown(data: unknown): { block: VexDescribeBlock | null } {
  const rec = isRecord(data);
  if (rec.record == null) {
    return { block: null };
  }
  const { name: label } = nameFromUnknown(rec.record.label);
  const { line } = lineFromUnknown(rec.record.line);
  if (label == null) {
    return { block: null };
  }
  if (line == null) {
    return { block: null };
  }
  const nestedRaw = rec.record.nestedDescribes;
  if (!Array.isArray(nestedRaw)) {
    return { block: null };
  }
  const nestedDescribes: VexDescribeBlock[] = [];
  for (const n of nestedRaw) {
    const b = vexDescribeBlockFromUnknown(n);
    if (b.block == null) {
      return { block: null };
    }
    nestedDescribes.push(b.block);
  }
  const whensRaw = rec.record.whens;
  if (!Array.isArray(whensRaw)) {
    return { block: null };
  }
  const whens: VexWhen[] = [];
  for (const w of whensRaw) {
    const when = vexWhenFromUnknown(w);
    if (when.when == null) {
      return { block: null };
    }
    whens.push(when.when);
  }
  return { block: { label, line, nestedDescribes, whens } };
}

export function vexDocumentFromUnknown(data: unknown): { document: VexDocument | null } {
  const rec = isRecord(data);
  if (rec.record == null) {
    return { document: null };
  }
  const describesRaw = rec.record.describes;
  if (!Array.isArray(describesRaw)) {
    return { document: null };
  }
  const describes: VexDescribeBlock[] = [];
  for (const d of describesRaw) {
    const b = vexDescribeBlockFromUnknown(d);
    if (b.block == null) {
      return { document: null };
    }
    describes.push(b.block);
  }
  return { document: { describes } };
}

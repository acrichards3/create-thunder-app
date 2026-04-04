import { INNER_PAD, NODE_MAX_W, NODE_W } from "./tree-types";

const CHAR_PX = 6.8;

export const BODY_LINE_STEP = 15;
export const KIND_BASELINE = 12;
export const BODY_FIRST_BASELINE = 24;
const PAD_BOTTOM = 10;

function splitLongWord(word: string, maxChars: number): string[] {
  if (word.length <= maxChars) {
    return [word];
  }
  const chunks: string[] = [];
  let i = 0;
  while (i < word.length) {
    chunks.push(word.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

function expandWordsWithBreaks(words: string[], maxChars: number): string[] {
  const out: string[] = [];
  words.forEach((word) => {
    out.push(...splitLongWord(word, maxChars));
  });
  return out;
}

function wrapLabelLines(label: string, maxChars: number): string[] {
  const trimmed = label.trim();
  if (trimmed.length === 0) {
    return [""];
  }
  const rawWords = trimmed.split(/\s+/u);
  const words = expandWordsWithBreaks(rawWords, maxChars);
  const lines: string[] = [];
  let current = words[0] ?? "";
  for (let i = 1; i < words.length; i++) {
    const w = words[i] ?? "";
    const next = `${current} ${w}`;
    if (next.length <= maxChars) {
      current = next;
    } else {
      lines.push(current);
      current = w;
    }
  }
  lines.push(current);
  return lines;
}

export function getWrappedBodyLines(label: string): string[] {
  const innerMax = NODE_MAX_W - INNER_PAD;
  const maxChars = Math.max(8, Math.floor(innerMax / CHAR_PX));
  return wrapLabelLines(label, maxChars);
}

export function measureNodeCard(label: string): { h: number; w: number } {
  const lines = getWrappedBodyLines(label);
  const longest = lines.reduce((max, line) => (line.length > max.length ? line : max), "");
  const w = Math.min(NODE_MAX_W, Math.max(NODE_W, Math.ceil(longest.length * 7.2) + INNER_PAD));
  const lastBodyBaseline = BODY_FIRST_BASELINE + (lines.length - 1) * BODY_LINE_STEP;
  const h = lastBodyBaseline + PAD_BOTTOM;
  return { h, w };
}

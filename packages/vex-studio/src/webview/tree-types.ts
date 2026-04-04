import type { LabelSpan } from "../vex-parse/types";

export const SVG_NS = "http://www.w3.org/2000/svg";
export const XHTML_NS = "http://www.w3.org/1999/xhtml";

export const NODE_W = 200;
export const NODE_MAX_W = 320;
export const INNER_PAD = 48;
export const V_GAP = 26;
export const H_GAP = 24;
export const STUB = 18;
export const TOP_PAD = 20;
export const SIDE_PAD = 24;

export const NODE_FILL = "#0f172a";
export const TEXT_MAIN = "#f1f5f9";
export const LINE_COLOR = "#64748b";

export const KIND_STYLES = {
  and: { color: "#22c55e", label: "AND" },
  describe: { color: "#3b82f6", label: "DESCRIBE" },
  it: { color: "#a855f7", label: "IT" },
  when: { color: "#d4a574", label: "WHEN" },
} as const;

export type TreeKind = keyof typeof KIND_STYLES;

export type SizedNode = {
  h: number;
  kids: SizedNode[];
  kind: TreeKind;
  label: string;
  labelSpan: LabelSpan;
  line: number;
  w: number;
};

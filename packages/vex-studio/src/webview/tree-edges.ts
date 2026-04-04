import { LINE_COLOR, SVG_NS } from "./tree-types";

function createSvgElement(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach((k) => {
    el.setAttribute(k, attrs[k] ?? "");
  });
  return el;
}

const STROKE_ATTRS = {
  stroke: LINE_COLOR,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "stroke-width": "1.5",
} as const;

export function drawArrow(g: SVGElement, x1: number, y1: number, x2: number, y2: number): void {
  g.appendChild(
    createSvgElement("line", {
      ...STROKE_ATTRS,
      "marker-end": "url(#vex-arr)",
      x1: String(x1),
      x2: String(x2),
      y1: String(y1),
      y2: String(y2),
    }),
  );
}

export function drawBranchConnector(g: SVGElement, x1: number, y1: number, x2: number, y2: number): void {
  if (Math.abs(x1 - x2) < 0.01) {
    drawArrow(g, x1, y1, x2, y2);
    return;
  }
  const dy = y2 - y1;
  const dx = Math.abs(x2 - x1);
  const raw = 0.38 * dy + 0.1 * dx;
  const c = Math.min(56, Math.max(16, Math.min(raw, dy * 0.48 - 0.5)));
  const d = `M ${String(x1)} ${String(y1)} C ${String(x1)} ${String(y1 + c)} ${String(x2)} ${String(y2 - c)} ${String(x2)} ${String(y2)}`;
  g.appendChild(
    createSvgElement("path", {
      ...STROKE_ATTRS,
      d,
      fill: "none",
      "marker-end": "url(#vex-arr)",
    }),
  );
}

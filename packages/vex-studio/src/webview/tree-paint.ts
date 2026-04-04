import type { DescribeBlock } from "../vex-parse/types";
import { drawArrow, drawBranchConnector } from "./tree-edges";
import { sizeDescribe } from "./tree-layout";
import { BODY_FIRST_BASELINE, BODY_LINE_STEP, KIND_BASELINE, getWrappedBodyLines, measureNodeCard } from "./tree-text";
import {
  H_GAP,
  KIND_STYLES,
  LINE_COLOR,
  NODE_FILL,
  SIDE_PAD,
  SVG_NS,
  STUB,
  TEXT_MAIN,
  TOP_PAD,
  V_GAP,
  type SizedNode,
} from "./tree-types";

function createSvgElement(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach((k) => {
    el.setAttribute(k, attrs[k] ?? "");
  });
  return el;
}

function appendCenteredText(
  parent: SVGElement,
  input: { attrs: Record<string, string>; cx: number; text: string; y: number },
): void {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("pointer-events", "none");
  g.setAttribute("transform", `translate(${String(input.cx)}, ${String(input.y)})`);
  const textEl = createSvgElement("text", {
    ...input.attrs,
    "dominant-baseline": "middle",
    "pointer-events": "none",
    "text-anchor": "middle",
    x: "0",
    y: "0",
  });
  textEl.appendChild(document.createTextNode(input.text));
  g.appendChild(textEl);
  parent.appendChild(g);
}

function drawCard(g: SVGElement, node: SizedNode, x: number, y: number, cardW: number, cardH: number): void {
  const style = KIND_STYLES[node.kind];
  const cardLeft = x + (node.w - cardW) / 2;
  const cx = cardLeft + cardW / 2;

  g.appendChild(
    createSvgElement("rect", {
      class: "vex-node-card",
      "data-label-enc": encodeURIComponent(node.label),
      "data-label-end": String(node.labelSpan.end),
      "data-label-start": String(node.labelSpan.start),
      fill: NODE_FILL,
      height: String(cardH),
      rx: "8",
      stroke: style.color,
      "stroke-width": "2",
      width: String(cardW),
      x: String(cardLeft),
      y: String(y),
    }),
  );

  appendCenteredText(g, {
    attrs: {
      fill: style.color,
      "font-family": "system-ui, sans-serif",
      "font-size": "9",
      "font-weight": "700",
      "letter-spacing": "1",
    },
    cx,
    text: style.label,
    y: y + KIND_BASELINE,
  });

  getWrappedBodyLines(node.label).forEach((line, i) => {
    appendCenteredText(g, {
      attrs: { fill: TEXT_MAIN, "font-family": "system-ui, sans-serif", "font-size": "11", "font-weight": "600" },
      cx,
      text: line,
      y: y + BODY_FIRST_BASELINE + i * BODY_LINE_STEP,
    });
  });
}

function paintNode(g: SVGElement, node: SizedNode, x: number, y: number): void {
  const { h: cardH, w: cardW } = measureNodeCard(node.label);
  drawCard(g, node, x, y, cardW, cardH);

  if (node.kids.length === 0) {
    return;
  }

  const parentCx = x + node.w / 2;
  const cardBottom = y + cardH;

  if (node.kids.length === 1) {
    const child = node.kids[0];
    const childX = x + (node.w - child.w) / 2;
    drawArrow(g, parentCx, cardBottom + 2, parentCx, cardBottom + V_GAP - 2);
    paintNode(g, child, childX, cardBottom + V_GAP);
    return;
  }

  let totalRowW = 0;
  node.kids.forEach((kid, i) => {
    totalRowW += kid.w;
    if (i < node.kids.length - 1) {
      totalRowW += H_GAP;
    }
  });

  const startX = x + (node.w - totalRowW) / 2;
  const elbowY = cardBottom + V_GAP + STUB;
  const childTopY = elbowY + V_GAP - 2;
  let curX = startX;

  node.kids.forEach((kid) => {
    const kidCx = curX + kid.w / 2;
    drawBranchConnector(g, parentCx, cardBottom + 2, kidCx, childTopY);
    paintNode(g, kid, curX, elbowY + V_GAP);
    curX += kid.w + H_GAP;
  });
}

function createArrowMarker(): SVGElement {
  const marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", "vex-arr");
  marker.setAttribute("markerWidth", "8");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "3");
  marker.setAttribute("orient", "auto");
  marker.appendChild(createSvgElement("polygon", { fill: LINE_COLOR, points: "0 0, 8 3, 0 6" }));
  return marker;
}

export function renderDescribeBlock(block: DescribeBlock): HTMLDivElement {
  const sized = sizeDescribe(block);
  const svgW = Math.max(sized.w + SIDE_PAD * 2, 320);
  const svgH = sized.h + TOP_PAD * 2;

  const wrap = document.createElement("div");
  wrap.id = "tree-wrap";
  wrap.style.boxSizing = "border-box";
  wrap.style.display = "block";
  wrap.style.maxWidth = "none";
  wrap.style.overflow = "visible";
  wrap.style.width = "fit-content";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("data-svg-base-h", String(svgH));
  svg.setAttribute("data-svg-base-w", String(svgW));
  svg.setAttribute("height", String(svgH));
  svg.setAttribute("overflow", "visible");
  svg.setAttribute("viewBox", `0 0 ${String(svgW)} ${String(svgH)}`);
  svg.setAttribute("width", String(svgW));
  svg.style.display = "block";

  const defs = document.createElementNS(SVG_NS, "defs");
  defs.appendChild(createArrowMarker());
  svg.appendChild(defs);

  const g = document.createElementNS(SVG_NS, "g");
  svg.appendChild(g);
  paintNode(g, sized, SIDE_PAD, TOP_PAD);

  wrap.appendChild(svg);
  return wrap;
}

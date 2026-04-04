import { NODE_FILL, SVG_NS, TEXT_MAIN, XHTML_NS } from "./tree-types";

const FO_CLASS = "vex-inline-edit-fo";

type VsCodeApi = { postMessage(message: unknown): void };

let activeFinishCommit: (() => void) | null = null;

function removeAllEditors(svg: SVGSVGElement): void {
  svg.querySelectorAll(`.${FO_CLASS}`).forEach((el) => {
    el.remove();
  });
}

export function clearInlineEditorFromContent(contentEl: HTMLElement | null): void {
  activeFinishCommit?.();
  activeFinishCommit = null;
  const svg = contentEl?.querySelector("#tree-wrap svg");
  if (svg instanceof SVGSVGElement) {
    removeAllEditors(svg);
  }
}

function hasFiniteAttr(el: SVGRectElement, name: string): boolean {
  const raw = el.getAttribute(name);
  if (raw == null) {
    return false;
  }
  return Number.isFinite(Number(raw));
}

function commitEdit(textarea: HTMLTextAreaElement, fo: SVGForeignObjectElement, api: VsCodeApi): void {
  const start = Number(textarea.dataset.start);
  const end = Number(textarea.dataset.end);
  const original = textarea.dataset.original ?? "";
  const next = textarea.value;
  fo.remove();
  if (!Number.isFinite(start)) {
    return;
  }
  if (!Number.isFinite(end)) {
    return;
  }
  if (start > end) {
    return;
  }
  if (next === original) {
    return;
  }
  api.postMessage({ end, start, text: next, type: "vexApplyLabelEdit" });
}

function createTextarea(label: string, start: number, end: number): HTMLTextAreaElement {
  const ta = document.createElement("textarea");
  ta.value = label;
  ta.dataset.start = String(start);
  ta.dataset.end = String(end);
  ta.dataset.original = label;
  ta.style.boxSizing = "border-box";
  ta.style.width = "100%";
  ta.style.height = "100%";
  ta.style.padding = "0";
  ta.style.border = "none";
  ta.style.resize = "none";
  ta.style.background = NODE_FILL;
  ta.style.color = TEXT_MAIN;
  ta.style.fontFamily = "system-ui, sans-serif";
  ta.style.fontSize = "11px";
  ta.style.fontWeight = "600";
  ta.style.lineHeight = "1.35";
  ta.style.outline = "none";
  return ta;
}

function openInlineEditor(card: SVGRectElement, api: VsCodeApi): void {
  const svg = card.ownerSVGElement;
  if (!svg) {
    return;
  }
  const requiredAttrs = ["data-label-start", "data-label-end", "x", "y", "width", "height"] as const;
  const allPresent = requiredAttrs.every((attr) => hasFiniteAttr(card, attr));
  if (!allPresent) {
    return;
  }
  const start = Number(card.getAttribute("data-label-start"));
  const end = Number(card.getAttribute("data-label-end"));
  const x = Number(card.getAttribute("x"));
  const y = Number(card.getAttribute("y"));
  const w = Number(card.getAttribute("width"));
  const h = Number(card.getAttribute("height"));
  if (start > end) {
    return;
  }
  const enc = card.getAttribute("data-label-enc");
  const label = enc != null && enc !== "" ? decodeURIComponent(enc) : "";

  activeFinishCommit?.();
  activeFinishCommit = null;
  removeAllEditors(svg);

  const fo = document.createElementNS(SVG_NS, "foreignObject");
  fo.setAttribute("class", FO_CLASS);
  fo.setAttribute("x", String(x));
  fo.setAttribute("y", String(y));
  fo.setAttribute("width", String(w));
  fo.setAttribute("height", String(h));

  const wrapper = document.createElementNS(XHTML_NS, "div");
  wrapper.setAttribute("class", "vex-inline-edit-inner");
  wrapper.style.boxSizing = "border-box";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.padding = "0";

  const ta = createTextarea(label, start, end);
  wrapper.appendChild(ta);
  fo.appendChild(wrapper);
  svg.appendChild(fo);

  let cancelled = false;
  let finished = false;

  function finishCommit(): void {
    if (cancelled) {
      return;
    }
    if (finished) {
      return;
    }
    finished = true;
    if (activeFinishCommit === finishCommit) {
      activeFinishCommit = null;
    }
    commitEdit(ta, fo, api);
  }

  activeFinishCommit = finishCommit;

  ta.addEventListener("blur", function onBlur() {
    finishCommit();
  });

  ta.addEventListener("keydown", function onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelled = true;
      if (activeFinishCommit === finishCommit) {
        activeFinishCommit = null;
      }
      fo.remove();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      finishCommit();
    }
  });

  ta.focus();
  ta.select();
}

function blurEditorIfOutsideTarget(target: EventTarget | null): void {
  const active = document.activeElement;
  if (!(active instanceof HTMLTextAreaElement)) {
    return;
  }
  const fo = active.closest(`.${FO_CLASS}`);
  if (!fo) {
    return;
  }
  if (!(target instanceof Node)) {
    return;
  }
  if (fo.contains(target)) {
    return;
  }
  active.blur();
}

export function isInlineEditorTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest(`.${FO_CLASS}`) != null;
}

export function setupInlineLabelEditing(contentEl: HTMLElement | null, api: VsCodeApi): void {
  if (!contentEl) {
    return;
  }

  document.addEventListener(
    "pointerdown",
    function onPointerDownCapture(e: PointerEvent): void {
      blurEditorIfOutsideTarget(e.target);
    },
    true,
  );

  contentEl.addEventListener("click", function onNodeCardClick(e: MouseEvent): void {
    const t = e.target;
    if (!(t instanceof SVGElement)) {
      return;
    }
    const card = t.closest("rect.vex-node-card");
    if (!card) {
      return;
    }
    if (!(card instanceof SVGRectElement)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    openInlineEditor(card, api);
  });
}

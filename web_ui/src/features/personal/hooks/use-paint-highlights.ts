"use client";
// Paints private highlights over rendered answers with the CSS Custom Highlight API, without touching the Markdown DOM.
import { useEffect, type RefObject } from "react";

import type { HighlightColor } from "@/types/conversation";
import { HIGHLIGHT_COLORS } from "@/utils/highlight-colors";

export interface PaintMark {
  turnId: string | null;
  text: string;
  color: HighlightColor;
}

type HighlightConstructor = new (...ranges: Range[]) => unknown;

/** Find the passage in the turn's text nodes, matching whitespace loosely, and return its range. */
function toPassageRange(root: HTMLElement, passage: string): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const positions: Array<{ node: Text; offset: number }> = [];
  let collapsedText = "";
  let isAfterSpace = true;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    if (node.parentElement?.closest("[data-no-mark]")) continue;
    for (let index = 0; index < node.data.length; index++) {
      const isSpace = /\s/.test(node.data[index]);
      if (isSpace && isAfterSpace) continue;
      collapsedText += isSpace ? " " : node.data[index];
      positions.push({ node, offset: index });
      isAfterSpace = isSpace;
    }
  }
  const target = passage.replace(/\s+/g, " ").trim();
  if (!target) return null;
  const start = collapsedText.indexOf(target);
  if (start < 0) return null;
  const first = positions[start];
  const last = positions[start + target.length - 1];
  const range = document.createRange();
  range.setStart(first.node, first.offset);
  range.setEnd(last.node, last.offset + 1);
  return range;
}

export function usePaintHighlights(rootRef: RefObject<HTMLElement | null>, marks: PaintMark[], version: unknown): void {
  useEffect(() => {
    const css = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS;
    const Highlight = (globalThis as { Highlight?: HighlightConstructor }).Highlight;
    const root = rootRef.current;
    // Browsers without the Custom Highlight API simply show no colours; the list page still works.
    if (!css?.highlights || !Highlight || !root) return;
    const colors = HIGHLIGHT_COLORS.map((option) => option.value);
    const rangesByColor = new Map<HighlightColor, Range[]>(colors.map((color) => [color, []]));
    for (const mark of marks) {
      const scope = mark.turnId ? root.querySelector<HTMLElement>(`[data-turn-body="${CSS.escape(mark.turnId)}"]`) : null;
      const candidates = scope ? [scope] : Array.from(root.querySelectorAll<HTMLElement>("[data-turn-body]"));
      for (const candidate of candidates) {
        const range = toPassageRange(candidate, mark.text);
        if (range) {
          rangesByColor.get(mark.color)!.push(range);
          break;
        }
      }
    }
    for (const color of colors) css.highlights.set(`hl-${color}`, new Highlight(...rangesByColor.get(color)!));
    return () => {
      for (const color of colors) css.highlights?.delete(`hl-${color}`);
    };
  }, [rootRef, marks, version]);
}

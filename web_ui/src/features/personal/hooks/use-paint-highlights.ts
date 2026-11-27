"use client";
// Paints private highlights over rendered answers with the CSS Custom Highlight API, without touching the Markdown DOM.
import { useEffect, type RefObject } from "react";

import type { HighlightColor } from "@/types/conversation";
import { HIGHLIGHT_COLORS } from "@/utils/highlight-colors";

import { createTextIndex, toRangeInIndex, type TextIndex } from "../utils/passage-range";

export interface PaintMark {
  turnId: string | null;
  text: string;
  color: HighlightColor;
}

type HighlightConstructor = new (...ranges: Range[]) => unknown;

export function usePaintHighlights(rootRef: RefObject<HTMLElement | null>, marks: PaintMark[], version: unknown): void {
  useEffect(() => {
    const css = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS;
    const Highlight = (globalThis as { Highlight?: HighlightConstructor }).Highlight;
    const root = rootRef.current;
    // Browsers without the Custom Highlight API simply show no colours; the list page still works.
    if (!css?.highlights || !Highlight || !root) return;
    const colors = HIGHLIGHT_COLORS.map((option) => option.value);
    const rangesByColor = new Map<HighlightColor, Range[]>(colors.map((color) => [color, []]));
    const indexByElement = new Map<HTMLElement, TextIndex>();
    const indexOf = (element: HTMLElement): TextIndex => {
      const cached = indexByElement.get(element);
      if (cached) return cached;
      const created = createTextIndex(element);
      indexByElement.set(element, created);
      return created;
    };
    for (const mark of marks) {
      const scope = mark.turnId ? root.querySelector<HTMLElement>(`[data-turn-body="${CSS.escape(mark.turnId)}"]`) : null;
      const candidates = scope ? [scope] : Array.from(root.querySelectorAll<HTMLElement>("[data-turn-body]"));
      for (const candidate of candidates) {
        const range = toRangeInIndex(indexOf(candidate), mark.text);
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

// Sizes a centred content column that widens with the free space, capped so lines stay comfortable to read.
import { cn } from "./cn";

/**
 * Widths follow the nearest `@container` (the page body), not the viewport, so collapsing a sidebar widens the column.
 * `reading` keeps body text near 70-90 characters per line; `wide` suits multi-column documents; `form` stays narrow.
 */
const WIDTH_CLASSES = {
  reading: "max-w-3xl @5xl:max-w-4xl @6xl:max-w-5xl",
  wide: "max-w-4xl @6xl:max-w-5xl @[88rem]:max-w-6xl",
  form: "max-w-2xl",
} as const;

export type ContentWidth = keyof typeof WIDTH_CLASSES;

export function toContentWidthClassName(width: ContentWidth): string {
  return cn("mx-auto w-full", WIDTH_CLASSES[width]);
}

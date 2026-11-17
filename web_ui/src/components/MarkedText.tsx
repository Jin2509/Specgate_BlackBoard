// Renders text with a chalk mark over each passage the viewer has highlighted.
import type { ReactNode } from "react";

export function MarkedText({ text, marks }: { text: string; marks: readonly string[] }): ReactNode {
  const found = marks
    .map((mark) => ({ mark, start: text.indexOf(mark) }))
    .filter((match) => match.start >= 0)
    .sort((first, second) => first.start - second.start);
  if (found.length === 0) return text;
  const parts: ReactNode[] = [];
  let position = 0;
  for (const { mark, start } of found) {
    if (start < position) continue;
    if (start > position) parts.push(text.slice(position, start));
    parts.push(
      <mark key={start} className="chalk-mark bg-transparent text-inherit">
        {mark}
      </mark>,
    );
    position = start + mark.length;
  }
  if (position < text.length) parts.push(text.slice(position));
  return parts;
}

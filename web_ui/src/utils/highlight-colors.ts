// Lists the colours a private highlight can take; the colours carry no meaning, the user decides what each one means.
import { t } from "@/lib/i18n";
import type { HighlightColor } from "@/types/conversation";

export const HIGHLIGHT_COLORS: ReadonlyArray<{ value: HighlightColor; label: string }> = [
  { value: "yellow", label: t.highlightColors.yellow },
  { value: "green", label: t.highlightColors.green },
  { value: "blue", label: t.highlightColors.blue },
  { value: "pink", label: t.highlightColors.pink },
  { value: "purple", label: t.highlightColors.purple },
];

export function toHighlightColorLabel(color: HighlightColor): string {
  return HIGHLIGHT_COLORS.find((option) => option.value === color)?.label ?? color;
}

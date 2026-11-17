// Renders a round colour swatch that toggles a highlight colour.
import type { HighlightColor } from "@/types/conversation";
import { cn } from "@/utils/cn";

export function ColorSwatchButton({
  color,
  label,
  isPressed,
  onClick,
  ringOffsetClassName,
}: {
  color: HighlightColor;
  label: string;
  isPressed: boolean;
  onClick: () => void;
  ringOffsetClassName: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isPressed}
      onClick={onClick}
      style={{ backgroundColor: `var(--hl-${color}-solid)` }}
      className={cn("size-5 rounded-full ring-offset-2", ringOffsetClassName, isPressed && "ring-2 ring-foreground")}
    />
  );
}

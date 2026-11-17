// Renders a small badge coloured by a semantic tone.
import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";
import { TONE_CLASSES, type Tone } from "@/utils/tone";

export function ToneBadge({
  tone,
  className,
  isSolid = false,
  ...props
}: ComponentProps<"span"> & { tone: Tone; isSolid?: boolean }) {
  const toneClasses = TONE_CLASSES[tone];
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-px text-[11px] leading-4 font-semibold whitespace-nowrap [&_svg]:size-3",
        toneClasses.text,
        isSolid ? toneClasses.soft : "bg-muted",
        className,
      )}
      {...props}
    />
  );
}

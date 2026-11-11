// Nhãn và chấm màu theo tông trạng thái.
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { toneClasses, type Tone } from "@/lib/status";

export function ToneBadge({
  tone,
  className,
  solid = false,
  ...props
}: ComponentProps<"span"> & { tone: Tone; solid?: boolean }) {
  const t = toneClasses[tone];
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-px text-[11px] leading-4 font-semibold whitespace-nowrap [&_svg]:size-3",
        t.text,
        solid ? t.soft : "bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function ToneDot({ tone, className }: { tone: Tone; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", toneClasses[tone].bar, className)} />;
}

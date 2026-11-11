// Một mục chú giải gồm ô màu nhỏ và nhãn.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LegendSwatch({ swatchClassName, children }: { swatchClassName: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", swatchClassName)} /> {children}
    </span>
  );
}

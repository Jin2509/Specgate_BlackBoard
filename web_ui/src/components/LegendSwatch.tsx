// Renders one legend entry: a small colour dot and its label.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function LegendSwatch({ swatchClassName, children }: { swatchClassName: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", swatchClassName)} /> {children}
    </span>
  );
}

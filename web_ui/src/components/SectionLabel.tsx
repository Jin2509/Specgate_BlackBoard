// Renders a small section heading inside a panel or column.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground", className)}>{children}</h3>
  );
}

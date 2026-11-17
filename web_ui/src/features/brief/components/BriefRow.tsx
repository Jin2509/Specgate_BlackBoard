// Renders one idea of the summary with its explanation underneath.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function BriefRow({ title, isStrong, children }: { title: string; isStrong?: boolean; children?: ReactNode }) {
  return (
    <div>
      <p className={cn("text-sm text-foreground", isStrong && "font-semibold text-sidebar-accent-foreground")}>{title}</p>
      {children ? <div className="mt-0.5 text-xs leading-relaxed text-subtle">{children}</div> : null}
    </div>
  );
}

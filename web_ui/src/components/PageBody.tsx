// Renders the scrolling, padded body of a page as a container-query context.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("@container flex-1 scrollbar-thin overflow-y-auto p-4 lg:p-6", className)}>{children}</div>;
}

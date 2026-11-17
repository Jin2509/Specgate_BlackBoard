// Lays out a page column: header on top, scrolling body below.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-1 flex-col bg-canvas", className)}>{children}</div>;
}

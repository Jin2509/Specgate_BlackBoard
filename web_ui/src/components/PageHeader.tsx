// Renders the fixed-height page header: icon, title, secondary text and actions.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function PageHeader({
  title,
  icon,
  meta,
  actions,
  className,
}: {
  title: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("@container/header flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4", className)}
    >
      {icon ? <span className="shrink-0 text-subtle [&_svg]:size-5">{icon}</span> : null}
      <h1 className="min-w-0 truncate text-[15px] font-semibold whitespace-nowrap text-sidebar-accent-foreground">{title}</h1>
      {meta ? (
        <span className="flex min-w-0 shrink-[2] items-center gap-2 @max-3xl/header:hidden">
          <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
          <span className="truncate text-sm text-subtle">{meta}</span>
        </span>
      ) : null}
      {actions ? <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}

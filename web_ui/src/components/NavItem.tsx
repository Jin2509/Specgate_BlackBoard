// Renders one sidebar navigation link with an icon and an optional count badge.
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function NavItem({
  href,
  isActive,
  icon,
  count,
  isCountUrgent,
  tone,
  children,
}: {
  href: string;
  isActive: boolean;
  icon: ReactNode;
  count?: number;
  isCountUrgent?: boolean;
  tone?: "data";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded px-2 text-[15px] font-medium transition-colors [&>svg]:size-5 [&>svg]:shrink-0",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-hover hover:text-muted-foreground",
        tone === "data" ? "[&>svg]:text-data" : "[&>svg]:text-subtle",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      {count !== undefined && count > 0 ? (
        <span
          className={cn(
            "tabular ml-auto text-xs",
            isCountUrgent
              ? "flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-bold text-primary-foreground"
              : "text-subtle",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

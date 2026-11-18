// Renders one sidebar navigation link with an icon and an optional count badge or unread dot.
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** `mention` is the stronger dot: someone named the viewer in an unread message. */
export type NavItemDot = "unread" | "mention";

export function NavItem({
  href,
  isActive,
  icon,
  count,
  isCountUrgent,
  dot,
  dotLabel,
  children,
}: {
  href: string;
  isActive: boolean;
  icon: ReactNode;
  count?: number;
  isCountUrgent?: boolean;
  dot?: NavItemDot;
  dotLabel?: string;
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
        "[&>svg]:text-subtle",
      )}
    >
      {icon}
      <span className={cn("truncate", dot && !isActive && "text-sidebar-accent-foreground")}>{children}</span>
      {dot ? (
        <span
          role="img"
          aria-label={dotLabel}
          className={cn("ml-auto shrink-0 rounded-full", dot === "mention" ? "size-2.5 bg-destructive" : "size-2 bg-subtle")}
        />
      ) : null}
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

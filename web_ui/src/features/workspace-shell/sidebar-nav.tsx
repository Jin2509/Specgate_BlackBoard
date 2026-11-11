// Nhóm và mục điều hướng dùng trong cột kênh.
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NavGroup({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="pt-4">
      <div className="flex items-center gap-0.5 pr-2 pb-1 pl-0.5 text-subtle hover:text-muted-foreground">
        <ChevronDown className="size-3" />
        <span className="flex-1 truncate text-xs font-bold tracking-wide uppercase">{label}</span>
        {action}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function NavItem({
  href,
  active,
  icon,
  count,
  highlightCount,
  tone,
  children,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  count?: number;
  highlightCount?: boolean;
  tone?: "data";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded px-2 text-[15px] font-medium transition-colors [&>svg]:size-5 [&>svg]:shrink-0",
        active
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
            highlightCount
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

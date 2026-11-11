// Nút chỉ có icon kèm tooltip, dùng trên thanh tiêu đề và ô soạn.
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function IconButton({
  label,
  href,
  onClick,
  active,
  className,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = cn(
    "inline-flex size-8 items-center justify-center rounded text-subtle transition-colors hover:text-sidebar-accent-foreground [&_svg]:size-5",
    active && "text-sidebar-accent-foreground",
    className,
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link href={href} aria-label={label} className={cls}>
            {children}
          </Link>
        ) : (
          <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={cls}>
            {children}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

"use client";
// Renders an icon-only button or link with a tooltip.
import Link from "next/link";
import type { ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { cn } from "@/utils/cn";

export function IconButton({
  label,
  href,
  onClick,
  isActive,
  className,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classNames = cn(
    "inline-flex size-8 items-center justify-center rounded text-subtle transition-colors hover:text-sidebar-accent-foreground [&_svg]:size-5",
    isActive && "text-sidebar-accent-foreground",
    className,
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link href={href} aria-label={label} className={classNames}>
            {children}
          </Link>
        ) : (
          <button type="button" aria-label={label} aria-pressed={isActive} onClick={onClick} className={classNames}>
            {children}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

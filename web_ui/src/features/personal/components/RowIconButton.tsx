// Renders a small icon button of a private highlight row.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function RowIconButton({
  label,
  onClick,
  isDanger,
  children,
}: {
  label: string;
  onClick: () => void;
  isDanger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded text-subtle hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isDanger ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

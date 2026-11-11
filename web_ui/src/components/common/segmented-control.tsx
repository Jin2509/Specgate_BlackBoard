// Nhóm nút chọn một trong nhiều giá trị.
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  activeClassName?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  itemClassName,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentOption<T>>;
  className?: string;
  itemClassName?: string;
  "aria-label"?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("rounded-md bg-input", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded transition-colors",
              itemClassName,
              active
                ? cn("bg-accent font-medium", o.activeClassName ?? "text-accent-foreground")
                : "text-subtle hover:bg-hover hover:text-muted-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

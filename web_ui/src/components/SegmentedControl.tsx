"use client";
// Renders a group of buttons where exactly one option is selected.
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

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
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded transition-colors",
              itemClassName,
              isSelected
                ? cn("bg-accent font-medium", option.activeClassName ?? "text-accent-foreground")
                : "text-subtle hover:bg-hover hover:text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

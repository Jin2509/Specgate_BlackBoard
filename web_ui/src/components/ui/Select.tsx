"use client";
// Renders a styled single-choice dropdown that replaces the browser's native select menu.
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { cn } from "@/utils/cn";

/** Radix reserves the empty string, so an empty option value travels through the menu under this marker. */
const EMPTY_VALUE = "__empty__";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

const SIZE_CLASSES = {
  sm: "h-7 px-2 text-xs",
  md: "h-8 px-2.5 text-[13px]",
  lg: "h-9 px-3 text-sm",
} as const;

function toMenuValue(value: string): string {
  return value === "" ? EMPTY_VALUE : value;
}

function fromMenuValue(value: string): string {
  return value === EMPTY_VALUE ? "" : value;
}

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  size = "md",
  isDisabled,
  className,
  contentClassName,
  id,
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  placeholder?: string;
  size?: keyof typeof SIZE_CLASSES;
  isDisabled?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label;
  return (
    <SelectPrimitive.Root
      value={toMenuValue(value)}
      onValueChange={(next) => onValueChange(fromMenuValue(next) as T)}
      disabled={isDisabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex min-w-0 items-center justify-between gap-1.5 rounded-md border border-border bg-card text-foreground shadow-xs transition-colors outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-subtle",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <span className="min-w-0 truncate">
          {/* The label is passed explicitly: Radix only fills it after mounting the hidden menu, which can leave it blank. */}
          <SelectPrimitive.Value placeholder={placeholder}>{selectedLabel}</SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-3.5 shrink-0 text-subtle" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-float data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            contentClassName,
          )}
        >
          <SelectPrimitive.Viewport className="max-h-72 p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={toMenuValue(option.value)}
                className="relative flex cursor-pointer items-center rounded-md py-1.5 pr-8 pl-2.5 text-[13px] outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <CheckIcon className="size-3.5 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

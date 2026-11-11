// Danh sách tích chọn mục đưa vào gói ngữ cảnh.
"use client";

import { Bot, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { BoardCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CapsulePicker({
  items,
  picked,
  onToggle,
}: {
  items: BoardCard[];
  picked: Set<string>;
  onToggle: (id: string, on: boolean) => void;
}) {
  return (
    <div className="scrollbar-thin space-y-1 overflow-y-auto">
      {items.map((i) => {
        const on = picked.has(i.id);
        return (
          <label
            key={i.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-hover",
              on && "bg-hover",
            )}
          >
            <Checkbox checked={on} onCheckedChange={(v) => onToggle(i.id, Boolean(v))} className="mt-0.5" />
            <span className="min-w-0">
              <span className="block text-[13px] leading-snug text-foreground">{i.body}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-subtle">
                {i.createdBy.kind === "agent" ? <Bot className="size-3" /> : <User className="size-3" />}
                {i.authorName}
                {i.kind === "note" ? " · ghi chú" : ""}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

// Hộp thoại chốt hoặc loại một ý (màn 07).
"use client";

import { Check, SquareTerminal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl, type SegmentOption } from "@/components/common/segmented-control";
import type { BoardCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BoardItemCard } from "./board-item-card";
import { decideCommand, type Decision } from "./decide-command";

const DECISION_OPTIONS: SegmentOption<Decision>[] = [
  {
    value: "decided",
    activeClassName: "text-decided",
    label: (
      <>
        <Check className="size-4" /> Chốt
      </>
    ),
  },
  {
    value: "rejected",
    activeClassName: "text-rejected",
    label: (
      <>
        <X className="size-4" /> Loại
      </>
    ),
  },
];

export function DecideDialog({
  item,
  open,
  onOpenChange,
  initialDecision = "rejected",
  initialReason = "",
  onConfirm,
}: {
  item: BoardCard | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDecision?: Decision;
  initialReason?: string;
  onConfirm?: (decision: Decision, reason: string) => void;
}) {
  const [decision, setDecision] = useState<Decision>(initialDecision);
  const [reason, setReason] = useState(initialReason);
  if (!item) return null;
  const valid = reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-125"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          document.getElementById("decide-reason")?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Chốt hay loại ý này</DialogTitle>
          <DialogDescription>Chỉ thành viên mới quyết định được. Agent không tự chốt.</DialogDescription>
        </DialogHeader>

        <BoardItemCard item={item} compact />

        <div className="grid gap-1.5">
          <Label>Quyết định</Label>
          <SegmentedControl
            aria-label="Quyết định"
            value={decision}
            onChange={setDecision}
            options={DECISION_OPTIONS}
            className="grid grid-cols-2 gap-1 p-1"
            itemClassName="flex items-center justify-center gap-1.5 py-1.5 text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="decide-reason">
            Lý do <span className="font-normal text-muted-foreground">· bắt buộc, agent sẽ đọc dòng này</span>
          </Label>
          <Textarea
            id="decide-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={!valid}
            placeholder="Vì sao chốt hoặc loại ý này?"
          />
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SquareTerminal className="size-3.5" /> Tương đương lệnh
          <code className="truncate rounded bg-input px-1.5 py-0.5 font-mono text-[11.5px] text-muted-foreground">
            {decideCommand(item.number, decision, reason)}
          </code>
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            disabled={!valid}
            className={cn(decision === "rejected" && "bg-rejected hover:bg-rejected/85")}
            onClick={() => {
              onConfirm?.(decision, reason.trim());
              onOpenChange(false);
            }}
          >
            {decision === "decided" ? <Check /> : <X />}
            {decision === "decided" ? "Chốt ý này" : "Loại ý này"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

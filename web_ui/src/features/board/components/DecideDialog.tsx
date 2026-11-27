"use client";
// Decides or rejects an idea with a required reason; the owner can also move a proposal into discussion.
import { Check, MessagesSquare, SquareTerminal, X } from "lucide-react";
import { useState } from "react";

import { SegmentedControl, type SegmentOption } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { t } from "@/lib/i18n";
import type { BoardCard, Decision } from "@/types/board";
import { cn } from "@/utils/cn";

import { BoardItemCard } from "./BoardItemCard";
import { toDecideCommand } from "../utils/decide-command";

const DECISION_OPTIONS: Array<SegmentOption<Decision>> = [
  {
    value: "decided",
    activeClassName: "text-decided",
    label: (
      <>
        <Check className="size-4" /> {t.board.decide}
      </>
    ),
  },
  {
    value: "rejected",
    activeClassName: "text-rejected",
    label: (
      <>
        <X className="size-4" /> {t.board.reject}
      </>
    ),
  },
];

export function DecideDialog({
  card,
  isOpen,
  onOpenChange,
  onConfirm,
  onDiscuss,
}: {
  card: BoardCard | undefined;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (decision: Decision, reason: string) => void;
  /** Present while the idea is still proposed and the viewer owns the workspace. */
  onDiscuss?: () => void;
}) {
  const [decision, setDecision] = useState<Decision>("rejected");
  const [reason, setReason] = useState("");
  if (!card) return null;
  const isValid = reason.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-125"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("decide-reason")?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t.board.decideTitle}</DialogTitle>
          <DialogDescription>{t.board.decideDescription}</DialogDescription>
        </DialogHeader>

        <BoardItemCard card={card} isCompact />

        <div className="grid gap-1.5">
          <Label>{t.board.decision}</Label>
          <SegmentedControl
            aria-label={t.board.decision}
            value={decision}
            onChange={setDecision}
            options={DECISION_OPTIONS}
            className="grid grid-cols-2 gap-1 p-1"
            itemClassName="flex items-center justify-center gap-1.5 py-1.5 text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="decide-reason">
            {t.board.reason} <span className="font-normal text-muted-foreground">{t.board.reasonRequired}</span>
          </Label>
          <Textarea
            id="decide-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={!isValid}
            placeholder={t.board.reasonPlaceholder}
          />
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SquareTerminal className="size-3.5" /> {t.board.equivalentCommand}
          <code className="truncate rounded bg-input px-1.5 py-0.5 font-mono text-[0.71875rem] text-muted-foreground">
            {toDecideCommand(card.number, decision, reason)}
          </code>
        </p>

        <DialogFooter>
          {onDiscuss ? (
            <Button
              variant="secondary"
              className="sm:mr-auto"
              onClick={() => {
                onDiscuss();
                onOpenChange(false);
              }}
            >
              <MessagesSquare /> {t.board.moveToDiscussing}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            disabled={!isValid}
            className={cn(decision === "rejected" && "bg-rejected hover:bg-rejected/85")}
            onClick={() => {
              onConfirm(decision, reason.trim());
              onOpenChange(false);
            }}
          >
            {decision === "decided" ? <Check /> : <X />}
            {decision === "decided" ? t.board.confirmDecide : t.board.confirmReject}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

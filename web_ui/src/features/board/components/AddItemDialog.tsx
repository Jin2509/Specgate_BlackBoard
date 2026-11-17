"use client";
// Adds an idea (to the Proposed column) or a note to the board, like /idea and /note in a channel.
import { Lightbulb, LoaderCircle, StickyNote } from "lucide-react";
import { useState, useTransition } from "react";

import { SegmentedControl, type SegmentOption } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { t } from "@/lib/i18n";
import type { BoardItemKind } from "@/types/board";

import { createBoardItem } from "../api/board-actions";

const KIND_OPTIONS: Array<SegmentOption<BoardItemKind>> = [
  {
    value: "idea",
    label: (
      <>
        <Lightbulb className="size-3.5" /> {t.board.kindIdea}
      </>
    ),
  },
  {
    value: "note",
    label: (
      <>
        <StickyNote className="size-3.5" /> {t.board.kindNote}
      </>
    ),
  },
];

export function AddItemDialog({
  workspaceId,
  isOpen,
  onOpenChange,
  onAdd,
}: {
  workspaceId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAdd: () => void;
}) {
  const [kind, setKind] = useState<BoardItemKind>("idea");
  const [body, setBody] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const outcome = await createBoardItem({ workspaceId, kind, body });
      if (!outcome.ok) return setErrorMessage(outcome.error);
      setBody("");
      setErrorMessage(null);
      onAdd();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{t.board.addTitle}</DialogTitle>
          <DialogDescription>{t.board.addDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label>{t.board.kind}</Label>
          <SegmentedControl
            aria-label={t.board.kindLabel}
            value={kind}
            onChange={setKind}
            options={KIND_OPTIONS}
            className="grid grid-cols-2 gap-1 p-1"
            itemClassName="flex items-center justify-center gap-1.5 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="board-item-body">{t.board.content}</Label>
          <Textarea
            id="board-item-body"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t.board.contentPlaceholder}
          />
        </div>
        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button disabled={isPending || !body.trim()} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.board.add}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

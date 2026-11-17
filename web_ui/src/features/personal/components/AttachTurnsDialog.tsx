"use client";
// Picks the original turns attached to a conversation summary; in the channel they sit collapsed inside its card.
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { format, t } from "@/lib/i18n";
import type { Turn } from "@/types/conversation";

import { listTurns } from "../api/conversation-actions";
import { updatePrivateHighlight } from "../api/private-highlight-actions";
import type { PrivateHighlightItem } from "../utils/private-highlight-item";

const MAX_ATTACHED_TURNS = 4;

export function AttachTurnsDialog({
  item,
  conversationId,
  onClose,
}: {
  item: PrivateHighlightItem;
  conversationId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [chosenIds, setChosenIds] = useState<string[]>(item.attachedTurns.map((turn) => turn.id));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isCurrent = true;
    void listTurns(conversationId).then((outcome) => {
      if (!isCurrent) return;
      if (outcome.ok) setTurns(outcome.value);
      else setError(outcome.error);
    });
    return () => {
      isCurrent = false;
    };
  }, [conversationId]);

  function handleSave() {
    startTransition(async () => {
      const outcome = await updatePrivateHighlight(item.id, { attachedTurnIds: chosenIds });
      if (!outcome.ok) return setError(outcome.error);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(isOpen) => (isOpen ? null : onClose())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.privateHighlights.attachTitle}</DialogTitle>
          <DialogDescription>{format(t.privateHighlights.attachDescription, { max: MAX_ATTACHED_TURNS })}</DialogDescription>
        </DialogHeader>
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {(turns ?? []).map((turn) => {
            const isChosen = chosenIds.includes(turn.id);
            return (
              <li key={turn.id}>
                <label className="flex gap-2 rounded-md p-2 hover:bg-hover">
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={isChosen}
                    disabled={!isChosen && chosenIds.length >= MAX_ATTACHED_TURNS}
                    onChange={(event) =>
                      setChosenIds((current) =>
                        event.target.checked ? [...current, turn.id] : current.filter((id) => id !== turn.id),
                      )
                    }
                  />
                  <span className="min-w-0 text-[13px]">
                    <span className="font-medium text-subtle">{turn.role === "user" ? t.personal.you : turn.model}: </span>
                    <span className="line-clamp-3">{turn.text}</span>
                  </span>
                </label>
              </li>
            );
          })}
          {turns === null && !error ? <li className="text-sm text-subtle">{t.common.loading}</li> : null}
        </ul>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button disabled={isPending} onClick={handleSave}>
            {t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

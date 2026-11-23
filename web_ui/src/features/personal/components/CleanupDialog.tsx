"use client";
// Deletes many private highlights at once by colour, conversation or sent state; cards in channels stay.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { HighlightColor } from "@/types/conversation";
import { HIGHLIGHT_COLORS } from "@/utils/highlight-colors";

import { deletePrivateHighlights } from "../api/private-highlight-actions";

export function CleanupDialog({
  isOpen,
  onOpenChange,
  conversations,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  conversations: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [color, setColor] = useState<HighlightColor | "">("");
  const [conversationId, setConversationId] = useState("");
  const [isSentOnly, setIsSentOnly] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasCondition = Boolean(color || conversationId || isSentOnly);

  function handleDelete() {
    startTransition(async () => {
      const outcome = await deletePrivateHighlights({
        color: color || undefined,
        conversationId: conversationId || undefined,
        sentOnly: isSentOnly,
      });
      if (!outcome.ok) return showErrorToast(outcome.error);
      setResultText(format(t.privateHighlights.cleanupDone, { deleted: outcome.value.deleted, total: outcome.value.total }));
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.privateHighlights.cleanupTitle}</DialogTitle>
          <DialogDescription>{t.privateHighlights.cleanupDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 text-[13px]">
          <Select
            aria-label={t.privateHighlights.color}
            size="lg"
            value={color}
            onValueChange={setColor}
            options={[
              { value: "", label: t.privateHighlights.allColors },
              ...HIGHLIGHT_COLORS.map((option) => ({
                value: option.value,
                label: format(t.personal.colorOption, { color: option.label }),
              })),
            ]}
          />
          <Select
            aria-label={t.privateHighlights.conversation}
            size="lg"
            value={conversationId}
            onValueChange={setConversationId}
            options={[
              { value: "", label: t.privateHighlights.allConversations },
              ...conversations.map((conversation) => ({ value: conversation.id, label: conversation.title })),
            ]}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-primary"
              checked={isSentOnly}
              onChange={(event) => setIsSentOnly(event.target.checked)}
            />
            {t.privateHighlights.sentOnly}
          </label>
        </div>
        {resultText ? <p className="text-sm text-muted-foreground">{resultText}</p> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t.common.close}
          </Button>
          <Button variant="destructive" disabled={!hasCondition || isPending} onClick={handleDelete}>
            {t.privateHighlights.deleteMatching}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

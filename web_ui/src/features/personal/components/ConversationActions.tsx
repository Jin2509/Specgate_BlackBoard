"use client";
// Offers "Summarize for the team" and deleting the conversation, always confirmed and asking whether to keep its highlights.
import { ListCollapse, LoaderCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

import { createConversationSummary, deleteConversation } from "../api/conversation-actions";
import { ICON_BUTTON_CLASS_NAME } from "../utils/icon-button-class";

export function ConversationActions({
  id,
  home,
  highlightCount,
  hasAnswer,
}: {
  id: string;
  home: string;
  highlightCount: number;
  hasAnswer: boolean;
}) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSummaryReady, setIsSummaryReady] = useState(false);

  function handleSummarize() {
    startTransition(async () => {
      const outcome = await createConversationSummary(id);
      if (!outcome.ok) return showErrorToast(outcome.error);
      setIsSummaryReady(true);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={!hasAnswer || isPending}
        title={t.personal.summarizeTitle}
        onClick={handleSummarize}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-hover hover:text-foreground disabled:opacity-40"
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ListCollapse className="size-4" />}
        <span className="@max-2xl/header:sr-only">{t.personal.summarizeForTeam}</span>
      </button>
      <button
        type="button"
        aria-label={t.personal.deleteConversation}
        title={t.personal.deleteConversationTitle}
        onClick={() => setIsConfirmOpen(true)}
        className={cn(ICON_BUTTON_CLASS_NAME, "hover:text-destructive")}
      >
        <Trash2 className="size-4.5" />
      </button>

      <Dialog open={isSummaryReady} onOpenChange={setIsSummaryReady}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.personal.summaryReady}</DialogTitle>
            <DialogDescription>{t.personal.summaryReadyBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsSummaryReady(false)}>
              {t.common.close}
            </Button>
            <Button asChild>
              <Link href={`${home}/highlights?kind=summary`}>{t.personal.openList}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.personal.confirmDeleteTitle}</DialogTitle>
            <DialogDescription>{t.personal.confirmDeleteWarning}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {highlightCount > 0 ? format(t.personal.confirmDeleteBody, { count: highlightCount }) : t.personal.confirmDeleteEmpty}
          </p>
          <DialogFooter>
            <Button variant="ghost" disabled={isPending} onClick={() => setIsConfirmOpen(false)}>
              {t.common.cancel}
            </Button>
            {highlightCount > 0 ? (
              <>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteConversation(id, "delete"))}
                >
                  {t.personal.deleteWithHighlights}
                </Button>
                <Button disabled={isPending} onClick={() => startTransition(() => deleteConversation(id, "keep"))}>
                  {t.personal.keepHighlights}
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => startTransition(() => deleteConversation(id, "keep"))}
              >
                {t.personal.deleteConversation}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

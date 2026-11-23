"use client";
// Lets the viewer trim or drop selected passages and add a private note before saving them for their agent.
import { Info, LoaderCircle, X } from "lucide-react";
import { useState, useTransition } from "react";

import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { HighlightLabel } from "@/types/highlight";
import { toEllipsizedText, toExcerpt } from "@/utils/excerpt";
import { HIGHLIGHT_LABEL_META } from "@/utils/status-meta";

import { createHighlight } from "../api/channel-actions";
import { isNarrowing, type SelectedSegment } from "../utils/selection-segments";

const NOTE_MAX_LENGTH = 1000;
const LABELS: readonly HighlightLabel[] = ["important", "review"];

export interface HighlightDraft {
  workspaceId: string;
  channelId: string;
  segments: SelectedSegment[];
}

export function HighlightDialog({
  draft,
  onClose,
  onSaved,
}: {
  draft: HighlightDraft | null;
  onClose: () => void;
  onSaved: (skippedCount: number) => void;
}) {
  return (
    <Dialog open={draft !== null} onOpenChange={(isOpen) => (isOpen ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        {draft ? (
          <DraftForm
            key={draft.segments.map((segment) => `${segment.messageId}:${segment.part}:${segment.text}`).join("|")}
            draft={draft}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DraftForm({
  draft,
  onClose,
  onSaved,
}: {
  draft: HighlightDraft;
  onClose: () => void;
  onSaved: (skippedCount: number) => void;
}) {
  const otherSegments = draft.segments.filter((segment) => !segment.own);
  const ownSegments = draft.segments.filter((segment) => segment.own);
  const [texts, setTexts] = useState(otherSegments.map((segment) => segment.text));
  const [removedIndexes, setRemovedIndexes] = useState<number[]>([]);
  const [label, setLabel] = useState<HighlightLabel>("important");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const keptSegments = otherSegments
    .map((segment, index) => ({ segment, index, text: texts[index] }))
    .filter((kept) => !removedIndexes.includes(kept.index));
  const hasInvalidEdit = keptSegments.some((kept) => !isNarrowing(kept.segment.text, kept.text));

  function handleSave() {
    startTransition(async () => {
      const outcome = await createHighlight({
        workspaceId: draft.workspaceId,
        channelId: draft.channelId,
        segments: keptSegments.map((kept) => ({
          messageId: kept.segment.messageId,
          part: kept.segment.part,
          turn: kept.segment.turn ?? null,
          text: kept.text,
        })),
        label,
        note: note.trim() || undefined,
      });
      if (outcome.ok) onSaved(ownSegments.length + outcome.skippedCount);
      else showErrorToast(outcome.error);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.channel.dialogTitle}</DialogTitle>
        <DialogDescription>{t.channel.dialogDescription}</DialogDescription>
      </DialogHeader>
      <ul className="max-h-[45vh] space-y-2.5 overflow-y-auto">
        {otherSegments.map((segment, index) => {
          if (removedIndexes.includes(index)) return null;
          const cut = toExcerpt(segment.source, texts[index]);
          const isRelayed = segment.speaker.startsWith(t.channel.relayedPrefix);
          return (
            <li key={index} className="rounded-md bg-muted p-2">
              <div className="mb-1 flex items-center gap-2 text-xs">
                <span className="font-semibold text-foreground">{segment.speaker}</span>
                <span className="text-subtle">
                  {isRelayed ? t.channel.verbWrote : t.channel.verbSaid}
                  {cut.partial ? t.channel.partialTag : ""}
                </span>
                <button
                  type="button"
                  aria-label={t.channel.removeSegment}
                  onClick={() => setRemovedIndexes((removed) => [...removed, index])}
                  className="ml-auto rounded p-0.5 text-subtle hover:bg-hover hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <Textarea
                aria-label={format(t.channel.segmentOf, { speaker: segment.speaker })}
                rows={2}
                value={texts[index]}
                onChange={(event) =>
                  setTexts((current) => current.map((text, position) => (position === index ? event.target.value : text)))
                }
              />
              {!isNarrowing(segment.text, texts[index]) ? (
                <p className="mt-1 text-xs text-destructive">{format(t.channel.narrowOnly, { speaker: segment.speaker })}</p>
              ) : (
                <p className="mt-1 text-xs text-subtle">
                  {format(t.channel.agentReads, { text: toEllipsizedText(texts[index].trim(), cut) })}
                  {cut.partial ? t.channel.agentReadsPartial : ""}
                  {isRelayed ? t.channel.agentReadsRelayed : ""}.
                </p>
              )}
            </li>
          );
        })}
        {ownSegments.map((segment, index) => (
          <li key={`own-${index}`} className="flex gap-1.5 rounded-md border border-dashed border-border p-2 text-xs text-subtle">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <span className="line-through">{segment.text}</span> {t.channel.ownSkipped}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid gap-1.5">
        <Label htmlFor="highlight-note" className="text-[13px] font-semibold text-muted-foreground">
          {t.channel.myNoteOptional}
        </Label>
        <Textarea
          id="highlight-note"
          rows={2}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted-foreground">{t.channel.label}</span>
        <SegmentedControl
          aria-label={t.channel.labelAria}
          value={label}
          onChange={setLabel}
          className="inline-flex w-fit gap-0.5 p-0.5"
          itemClassName="px-3 py-1.5 text-sm"
          options={LABELS.map((value) => ({ value, label: HIGHLIGHT_LABEL_META[value].label }))}
        />
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t.common.cancel}
        </Button>
        <Button onClick={handleSave} disabled={isPending || keptSegments.length === 0 || hasInvalidEdit}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.channel.saveHighlight}
        </Button>
      </DialogFooter>
    </>
  );
}

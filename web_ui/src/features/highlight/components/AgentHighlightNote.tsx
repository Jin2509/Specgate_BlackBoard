"use client";
// Edits the label and "My note" of a highlight for the agent; the speaker's words themselves cannot be edited.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Select } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { HighlightLabel } from "@/types/highlight";
import { HIGHLIGHT_LABEL_META } from "@/utils/status-meta";

import { updateHighlight } from "../api/highlight-actions";

const NOTE_MAX_LENGTH = 1000;
const LABELS = Object.keys(HIGHLIGHT_LABEL_META) as HighlightLabel[];

export function AgentHighlightNote({ id, note, label }: { id: string; note: string | null; label: HighlightLabel }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [noteText, setNoteText] = useState(note ?? "");
  const [chosenLabel, setChosenLabel] = useState<HighlightLabel>(label);
  const [isPending, startTransition] = useTransition();
  if (!isOpen)
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="mt-1 ml-3 text-xs text-subtle hover:text-foreground">
        {note ? format(t.highlight.myNoteEdit, { note }) : t.highlight.addNoteOrLabel}
      </button>
    );
  return (
    <form
      className="mt-1.5 ml-3 flex flex-wrap items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const outcome = await updateHighlight(id, { note: noteText, label: chosenLabel });
          if (!outcome.ok) return showErrorToast(outcome.error);
          setIsOpen(false);
          router.refresh();
        });
      }}
    >
      <Select
        aria-label={t.channel.label}
        size="sm"
        value={chosenLabel}
        onValueChange={setChosenLabel}
        options={LABELS.map((value) => ({ value, label: HIGHLIGHT_LABEL_META[value].label }))}
      />
      <input
        aria-label={t.highlight.myNote}
        value={noteText}
        maxLength={NOTE_MAX_LENGTH}
        onChange={(event) => setNoteText(event.target.value)}
        placeholder={t.highlight.myNote}
        className="h-7 min-w-48 flex-1 rounded-md border border-border bg-input px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-7 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground"
      >
        {t.common.save}
      </button>
      <button type="button" onClick={() => setIsOpen(false)} className="text-xs text-subtle">
        {t.common.cancel}
      </button>
    </form>
  );
}

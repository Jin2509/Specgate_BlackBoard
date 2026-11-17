"use client";
// Floats over a selected passage of the chat to save it as a private highlight in a colour, with an optional note.
import { Highlighter, LoaderCircle, StickyNote } from "lucide-react";
import { useState } from "react";

import { format, t } from "@/lib/i18n";
import type { HighlightColor } from "@/types/conversation";
import { cn } from "@/utils/cn";
import { HIGHLIGHT_COLORS } from "@/utils/highlight-colors";

const NOTE_MAX_LENGTH = 500;

export interface SelectionTip {
  turnId: string;
  text: string;
  top: number;
  left: number;
}

export function ChatSelectionBar({
  tip,
  onSave,
  onCancel,
}: {
  tip: SelectionTip;
  /** Resolve to an error message, or null once saved. */
  onSave: (color: HighlightColor, note?: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  return (
    <div
      style={{ top: tip.top, left: tip.left }}
      onMouseDown={(event) => {
        if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
      }}
      onMouseUp={(event) => event.stopPropagation()}
      className="absolute z-10 w-[19rem] rounded-lg bg-card p-2 shadow-float"
      role="toolbar"
      aria-label={t.personal.savePrivateToolbar}
    >
      <div className="flex items-center gap-1.5">
        <Highlighter className="size-4 text-subtle" />
        {HIGHLIGHT_COLORS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-label={format(t.personal.colorOption, { color: option.label })}
            aria-pressed={color === option.value}
            onClick={() => setColor(option.value)}
            style={{ backgroundColor: `var(--hl-${option.value}-solid)` }}
            className={cn(
              "size-5 rounded-full ring-offset-2 ring-offset-card focus-visible:outline-none",
              color === option.value ? "ring-2 ring-foreground" : "hover:ring-1 hover:ring-subtle",
            )}
          />
        ))}
        <button
          type="button"
          aria-label={t.personal.addNote}
          title={t.personal.addNote}
          onClick={() => setIsNoteOpen((isOpen) => !isOpen)}
          className={cn("ml-1 rounded p-1 text-subtle hover:bg-hover", isNoteOpen && "bg-hover text-foreground")}
        >
          <StickyNote className="size-4" />
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={async () => {
            setIsSaving(true);
            setError(await onSave(color, note.trim() || undefined));
            setIsSaving(false);
          }}
          className="ml-auto inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-[13px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {isSaving ? <LoaderCircle className="size-3.5 animate-spin" /> : t.common.save}
        </button>
        <button type="button" onClick={onCancel} className="rounded px-1 text-xs text-subtle hover:text-foreground">
          {t.common.cancel}
        </button>
      </div>
      {isNoteOpen ? (
        <input
          autoFocus
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t.personal.notePlaceholder}
          className="mt-2 h-8 w-full rounded-md border border-border bg-input px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : null}
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

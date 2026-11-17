"use client";
// Renders one private highlight with its sends, and lets the user edit, attach turns, send or delete it.
import { Check, ListCollapse, LoaderCircle, Paperclip, Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { format, t } from "@/lib/i18n";
import type { HighlightColor } from "@/types/conversation";
import { cn } from "@/utils/cn";
import { HIGHLIGHT_COLORS, toHighlightColorLabel } from "@/utils/highlight-colors";

import { AttachTurnsDialog } from "./AttachTurnsDialog";
import { ColorSwatchButton } from "./ColorSwatchButton";
import { RowIconButton } from "./RowIconButton";
import { deletePrivateHighlight, updatePrivateHighlight } from "../api/private-highlight-actions";
import { isAgentTextEdited, type PrivateHighlightItem } from "../utils/private-highlight-item";

const NOTE_MAX_LENGTH = 500;
const PASSAGE_EDIT_ROWS = 4;
const SUMMARY_EDIT_ROWS = 8;

export function PrivateHighlightRow({
  item,
  home,
  isPicked,
  onPickChange,
  onSend,
}: {
  item: PrivateHighlightItem;
  home: string;
  isPicked: boolean;
  onPickChange: (isPicked: boolean) => void;
  onSend: () => void;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [note, setNote] = useState(item.note ?? "");
  const [color, setColor] = useState<HighlightColor>(item.color);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isSummary = item.kind !== "passage";

  function handleSave() {
    startTransition(async () => {
      const outcome = await updatePrivateHighlight(item.id, { text, color, note: note || null });
      if (!outcome.ok) return setError(outcome.error);
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePrivateHighlight(item.id);
      router.refresh();
    });
  }

  return (
    <li className={cn("rounded-lg bg-card p-3", isPicked && "ring-2 ring-primary")}>
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          aria-label={t.privateHighlights.pick}
          checked={isPicked}
          onChange={(event) => onPickChange(event.target.checked)}
          className="mt-1 size-4 accent-primary"
        />
        <span
          aria-label={format(t.personal.colorOption, { color: toHighlightColorLabel(item.color) })}
          className="mt-1.5 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: `var(--hl-${item.color}-solid)` }}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-subtle">
            {isSummary ? (
              <span className="inline-flex items-center gap-1 rounded bg-insufficient-soft px-1.5 py-px font-medium text-insufficient">
                <ListCollapse className="size-3" />{" "}
                {item.kind === "digest" ? t.privateHighlights.digestTag : t.privateHighlights.summaryTag}
              </span>
            ) : null}
            <span className="font-medium text-muted-foreground">
              {format(t.privateHighlights.saidBy, { speaker: item.speaker })}
              {item.edited ? t.privateHighlights.editedByYou : ""}
            </span>
            {item.model ? <span className="font-mono">{item.model}</span> : null}
            <span>·</span>
            {item.conversationDeleted ? (
              <span>{t.privateHighlights.conversationDeleted}</span>
            ) : item.conversationId ? (
              <Link href={`${home}/${item.conversationId}`} className="hover:text-foreground hover:underline">
                {item.conversationTitle}
              </Link>
            ) : (
              <span>{item.conversationTitle}</span>
            )}
            <span>· {item.createdAtLabel}</span>
          </p>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                aria-label={t.privateHighlights.content}
                rows={isSummary ? SUMMARY_EDIT_ROWS : PASSAGE_EDIT_ROWS}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              {text.trim() && isAgentTextEdited(item, text) ? (
                <p className="text-xs text-proposed">{t.privateHighlights.editedAgentWords}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {HIGHLIGHT_COLORS.map((option) => (
                  <ColorSwatchButton
                    key={option.value}
                    color={option.value}
                    label={format(t.personal.colorOption, { color: option.label })}
                    isPressed={color === option.value}
                    onClick={() => setColor(option.value)}
                    ringOffsetClassName="ring-offset-card"
                  />
                ))}
                <input
                  aria-label={t.privateHighlights.note}
                  value={note}
                  maxLength={NOTE_MAX_LENGTH}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t.privateHighlights.note}
                  className="h-8 min-w-40 flex-1 rounded-md border border-border bg-input px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" disabled={isPending} onClick={handleSave}>
                  <Check /> {t.common.save}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <p className={cn("mt-1.5 text-[14.5px] leading-relaxed whitespace-pre-line", isSummary && "line-clamp-[10]")}>
              {item.text}
            </p>
          )}
          {!isEditing && item.note ? (
            <p className="mt-1 text-xs text-muted-foreground">{format(t.privateHighlights.noteLine, { note: item.note })}</p>
          ) : null}
          {item.attachedTurns.length ? (
            <p className="mt-1 text-xs text-subtle">
              {format(t.privateHighlights.attachedTurns, { count: item.attachedTurns.length })}
            </p>
          ) : null}
          {item.sends.length ? (
            <ul className="mt-1.5 space-y-0.5 text-xs text-subtle">
              {item.sends.map((send) => (
                <li key={send.messageId}>
                  {t.privateHighlights.sentTo}{" "}
                  <Link href={`/w/${send.workspaceId}/c/${send.channelId}`} className="text-muted-foreground hover:underline">
                    {send.workspaceName} #{send.channelName}
                  </Link>{" "}
                  {format(t.privateHighlights.sentAt, { time: send.atLabel })}
                </li>
              ))}
            </ul>
          ) : null}
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Button size="sm" variant="outline" onClick={onSend}>
            <Send /> {t.privateHighlights.send}
          </Button>
          <div className="flex gap-0.5">
            <RowIconButton label={t.common.edit} onClick={() => setIsEditing(true)}>
              <Pencil className="size-3.5" />
            </RowIconButton>
            {item.kind === "summary" && item.conversationId ? (
              <RowIconButton label={t.privateHighlights.attachTurns} onClick={() => setIsAttaching(true)}>
                <Paperclip className="size-3.5" />
              </RowIconButton>
            ) : null}
            <RowIconButton label={t.privateHighlights.deleteKeepsCards} isDanger onClick={handleDelete}>
              {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </RowIconButton>
          </div>
        </div>
      </div>
      {isAttaching && item.conversationId ? (
        <AttachTurnsDialog item={item} conversationId={item.conversationId} onClose={() => setIsAttaching(false)} />
      ) : null}
    </li>
  );
}

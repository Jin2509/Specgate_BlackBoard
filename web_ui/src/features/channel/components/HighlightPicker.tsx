"use client";
// Floats "My highlights" above the composer: filter by colour or search text, click to attach a quote card.
import { ListCollapse, X } from "lucide-react";
import { useState } from "react";

import { format, t } from "@/lib/i18n";
import type { HighlightColor, PrivateHighlight } from "@/types/conversation";
import { cn } from "@/utils/cn";
import { HIGHLIGHT_COLORS } from "@/utils/highlight-colors";

export function HighlightPicker({
  highlights,
  chosenIds,
  channelId,
  onPick,
  onClose,
}: {
  highlights: PrivateHighlight[];
  chosenIds: string[];
  channelId: string;
  onPick: (highlightId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<HighlightColor | "">("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleHighlights = highlights.filter(
    (highlight) =>
      !chosenIds.includes(highlight.id) &&
      (!color || highlight.color === color) &&
      (!normalizedQuery || `${highlight.text} ${highlight.note ?? ""}`.toLowerCase().includes(normalizedQuery)),
  );
  return (
    <div className="absolute bottom-full left-4 z-20 mb-1 w-[min(34rem,calc(100%-2rem))] rounded-lg bg-card p-2 shadow-float">
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <p className="text-[12.5px] font-semibold text-subtle">{t.channel.myHighlights}</p>
        {HIGHLIGHT_COLORS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-label={format(t.channel.filterColor, { color: option.label })}
            aria-pressed={color === option.value}
            onClick={() => setColor(color === option.value ? "" : option.value)}
            style={{ backgroundColor: `var(--hl-${option.value}-solid)` }}
            className={cn(
              "size-4 rounded-full ring-offset-2 ring-offset-card",
              color === option.value && "ring-2 ring-foreground",
            )}
          />
        ))}
        <input
          autoFocus
          aria-label={t.channel.searchHighlights}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => (event.key === "Escape" ? onClose() : null)}
          placeholder={t.channel.searchPlaceholder}
          className="ml-1 h-7 min-w-0 flex-1 rounded-md border border-border bg-input px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="button" aria-label={t.common.close} onClick={onClose} className="rounded p-1 text-subtle hover:bg-hover">
          <X className="size-4" />
        </button>
      </div>
      <ul role="listbox" className="max-h-72 space-y-0.5 overflow-y-auto">
        {visibleHighlights.map((highlight) => {
          const isSentHere = highlight.sends.some((send) => send.channelId === channelId);
          return (
            <li key={highlight.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(highlight.id);
                }}
                className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
              >
                <span
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--hl-${highlight.color}-solid)` }}
                />
                <span className="min-w-0 flex-1 text-[13px]">
                  <span className="flex items-center gap-1.5 text-xs text-subtle">
                    {highlight.kind !== "passage" ? <ListCollapse className="size-3" /> : null}
                    {highlight.kind === "summary" ? t.channel.summaryKind : highlight.speaker} · {highlight.conversationTitle}
                    {isSentHere ? <span className="text-proposed">{t.channel.sentHere}</span> : null}
                  </span>
                  <span className="line-clamp-2 text-foreground">{highlight.text}</span>
                </span>
              </button>
            </li>
          );
        })}
        {visibleHighlights.length === 0 ? (
          <li className="px-2 py-3 text-center text-[13px] text-subtle">
            {highlights.length === 0 ? t.channel.noPrivateHighlights : t.channel.noMatch}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

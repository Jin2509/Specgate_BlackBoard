"use client";
// Scrolls the channel to new messages and offers "Highlight for my agent" when the viewer selects other people's words.
import { Highlighter, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { format, t } from "@/lib/i18n";

import { HighlightDialog, type HighlightDraft } from "./HighlightDialog";
import { listSelectedSegments } from "../utils/selection-segments";

const TIP_OFFSET_TOP_PX = 40;
const TIP_HALF_WIDTH_PX = 110;
const TIP_MAX_RIGHT_PX = 300;
const TIP_MIN_LEFT_PX = 8;

interface SelectionTip {
  draft: HighlightDraft;
  isAllOwn: boolean;
  top: number;
  left: number;
}

export function HighlightableList({
  workspaceId,
  channelId,
  watch,
  className,
  children,
}: {
  workspaceId: string;
  channelId: string;
  watch: unknown;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<SelectionTip | null>(null);
  const [draft, setDraft] = useState<HighlightDraft | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const scrollBox = scrollRef.current;
    if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
  }, [watch]);

  function handleSelectionEnd() {
    const selection = window.getSelection();
    const scrollBox = scrollRef.current;
    if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !scrollBox) return setTip(null);
    const range = selection.getRangeAt(0);
    if (!scrollBox.contains(range.commonAncestorContainer)) return setTip(null);
    const segments = listSelectedSegments(range, scrollBox);
    if (segments.length === 0) return setTip(null);
    const rect = range.getBoundingClientRect();
    const outer = scrollBox.getBoundingClientRect();
    setSavedNotice(null);
    setTip({
      isAllOwn: segments.every((segment) => segment.own),
      draft: { workspaceId, channelId, segments },
      top: rect.top - outer.top + scrollBox.scrollTop - TIP_OFFSET_TOP_PX,
      left: Math.max(
        TIP_MIN_LEFT_PX,
        Math.min(rect.left - outer.left + rect.width / 2 - TIP_HALF_WIDTH_PX, outer.width - TIP_MAX_RIGHT_PX),
      ),
    });
  }

  function handleSaved(skippedCount: number) {
    setDraft(null);
    const skipped = skippedCount ? ` ${format(t.channel.highlightSkipped, { count: skippedCount })}` : "";
    setSavedNotice(`${t.channel.highlightSaved}${skipped}`);
    window.getSelection()?.removeAllRanges();
    router.refresh();
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onMouseUp={handleSelectionEnd}
        onKeyUp={(event) => (event.shiftKey ? handleSelectionEnd() : null)}
        className={className}
      >
        <div className="relative">
          {children}
          {tip ? (
            tip.isAllOwn ? (
              <p
                role="status"
                style={{ top: tip.top, left: tip.left }}
                className="absolute z-10 inline-flex h-8 items-center gap-1.5 rounded-md bg-card px-3 text-[0.8125rem] text-muted-foreground shadow-float"
              >
                <Info className="size-4 text-subtle" /> {t.channel.ownSelectionNotice}
              </p>
            ) : (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setDraft(tip.draft);
                  setTip(null);
                }}
                style={{ top: tip.top, left: tip.left }}
                className="absolute z-10 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-float focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
              >
                <Highlighter className="size-4" /> {t.channel.highlightForMyAgent}
              </button>
            )
          ) : null}
        </div>
      </div>
      {savedNotice ? (
        <p role="status" className="px-4 pb-1 text-[0.8125rem] text-muted-foreground">
          {savedNotice}
        </p>
      ) : null}
      <HighlightDialog draft={draft} onClose={() => setDraft(null)} onSaved={handleSaved} />
    </div>
  );
}

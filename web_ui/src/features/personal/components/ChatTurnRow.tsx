// Renders one turn of a private conversation: the user's question or the agent's Markdown answer with its actions.
import { RotateCcw } from "lucide-react";

import { CopyButton } from "@/components/CopyButton";
import { Markdown } from "@/components/Markdown";
import { t } from "@/lib/i18n";
import type { Turn } from "@/types/conversation";
import { cn } from "@/utils/cn";

import { toUsageLabel } from "../utils/document-format";

export function ChatTurnRow({
  turn,
  isLocal = false,
  isTyping = false,
  canRegenerate = false,
  onRegenerate,
}: {
  turn: Turn;
  isLocal?: boolean;
  isTyping?: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const isMine = turn.role === "user";
  const isAnswer = !isMine && !isTyping && !turn.error;
  return (
    <li
      data-turn-id={turn.id}
      data-role={turn.role}
      data-error={turn.error || undefined}
      data-local={isLocal || undefined}
      className="group grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4 @max-xl:grid-cols-1 @max-xl:gap-1"
    >
      <div className="pt-0.5 leading-tight" data-no-mark>
        <span className={cn("block truncate text-xs", isMine ? "font-semibold text-muted-foreground" : "font-mono text-agent")}>
          {isMine ? t.personal.you : turn.model}
        </span>
        {turn.at ? <time className="text-[11px] text-subtle">{turn.at}</time> : null}
      </div>
      <div className="min-w-0">
        <div
          data-turn-body={turn.id}
          className={cn(
            "text-[15px] leading-relaxed",
            isMine ? "border-l-2 border-border pl-3 whitespace-pre-wrap text-muted-foreground" : "text-foreground",
            turn.error && "text-destructive",
          )}
        >
          {isMine || turn.error ? turn.text : <Markdown text={turn.text} />}
          {isTyping ? <span className="stream-caret" aria-hidden /> : null}
        </div>
        {turn.stopped ? <p className="mt-1 text-xs text-subtle">{t.personal.stoppedNote}</p> : null}
        {isAnswer ? (
          <div
            data-no-mark
            className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
          >
            <CopyButton text={turn.text} />
            {turn.usage ? <span className="px-1.5 text-xs text-subtle tabular-nums">{toUsageLabel(turn.usage)}</span> : null}
            {canRegenerate ? (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <RotateCcw className="size-3.5" /> {t.personal.regenerate}
              </button>
            ) : null}
          </div>
        ) : null}
        {!isMine && turn.error && canRegenerate ? (
          <button type="button" onClick={onRegenerate} className="mt-1.5 text-xs text-subtle hover:text-foreground">
            <RotateCcw className="mr-1 inline size-3.5" /> {t.personal.retry}
          </button>
        ) : null}
      </div>
    </li>
  );
}

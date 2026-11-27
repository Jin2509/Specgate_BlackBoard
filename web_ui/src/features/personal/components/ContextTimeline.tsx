// Lists what the agent reads from the team, in time order: the user's messages, old-message digests and highlights.
import { Hash, Trash2 } from "lucide-react";
import Link from "next/link";

import { deleteHighlight, HighlightQuote } from "@/features/highlight";
import { format, t } from "@/lib/i18n";
import type { AgentContext, TimelineItem } from "@/types/highlight";
import { toDayClock } from "@/utils/date-format";
import { listSegmentNotices, toSegmentsText } from "@/utils/excerpt";
import { toSharedHomePath } from "@/utils/route-paths";

const VISIBLE_ITEM_COUNT = 12;

export function ContextTimeline({ context }: { context: AgentContext }) {
  const workspaceId = context.workspace.id;
  if (context.timeline.length === 0) {
    return (
      <p className="mt-1.5 text-subtle">
        {t.personal.timelineEmptyBefore}{" "}
        <Link href={toSharedHomePath(workspaceId)} className="text-primary-strong underline-offset-2 hover:underline">
          {t.personal.teamChannel}
        </Link>{" "}
        {t.personal.timelineEmptyAfter}
      </p>
    );
  }
  return (
    <>
      <ol className="mt-2 space-y-2.5">
        {context.timeline.slice(-VISIBLE_ITEM_COUNT).map((item) => (
          <TimelineEntry key={`${item.kind}-${item.id}`} item={item} workspaceId={workspaceId} />
        ))}
      </ol>
      {context.timeline.length > VISIBLE_ITEM_COUNT ? (
        <p className="mt-1.5 text-xs text-subtle">
          {format(t.personal.timelineTruncated, { shown: VISIBLE_ITEM_COUNT, total: context.timeline.length })}
        </p>
      ) : null}
    </>
  );
}

function TimelineEntry({ item, workspaceId }: { item: TimelineItem; workspaceId: string }) {
  if (item.kind === "own") {
    return (
      <li className="text-muted-foreground">
        <p className="text-[0.6875rem] text-subtle">
          {toDayClock(item.at)} · #{item.channelName}
          {item.replyTo ? format(t.personal.replyTo, { speaker: item.replyTo.speaker }) : ""}
          {item.fromDigest ? t.personal.fromDigest : ""}
        </p>
        <p className="line-clamp-3 whitespace-pre-line">{item.text}</p>
      </li>
    );
  }
  if (item.kind === "digest") {
    return (
      <li className="rounded-md border border-dashed border-border p-2 text-muted-foreground">
        <p className="text-[0.6875rem] font-medium text-subtle">
          {format(t.personal.digestBlock, { title: item.title, count: item.count })}
        </p>
        <p className="mt-0.5 line-clamp-4 whitespace-pre-line">{item.text}</p>
      </li>
    );
  }
  const speakers = [...new Set(item.segments.map((segment) => segment.speaker))].join(", ");
  return (
    <li>
      <HighlightQuote
        className="max-w-none"
        text={toSegmentsText(item.segments)}
        label={item.label}
        notices={listSegmentNotices(item.segments)}
        byline={
          <>
            <span className="font-medium text-muted-foreground">{speakers}</span> {t.personal.said} ·{" "}
            <Link href={`/w/${workspaceId}/c/${item.channelId}`} className="inline-flex items-center hover:underline">
              <Hash className="size-3" />
              {item.channelName ?? item.channelId}
            </Link>
          </>
        }
        note={item.note}
        actions={
          <form action={deleteHighlight}>
            <input type="hidden" name="highlightId" value={item.id} />
            <button
              type="submit"
              aria-label={t.personal.removeFromContext}
              className="inline-flex size-6 items-center justify-center rounded text-subtle hover:bg-hover hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Trash2 className="size-3.5" />
            </button>
          </form>
        }
      />
    </li>
  );
}

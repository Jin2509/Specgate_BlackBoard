// Phần đính kèm dưới tin nhắn: xác nhận ghi bảng, highlight từ workspace riêng, thẻ /stats, thẻ /run.
import { Check, Pin, SquareArrowUpRight } from "lucide-react";
import { HighlightQuote } from "@/features/highlight/highlight-quote";
import { moveHighlightToBoard } from "@/lib/channel-actions";
import { getSharedHighlight, isHighlightOnBoard } from "@/lib/mock/queries";
import { RunProgressCard } from "@/features/metrics/run-progress-card";
import { StatsCard } from "@/features/metrics/stats-card";
import { ideaStatusMeta } from "@/lib/status";
import type { Attachment } from "@/lib/types";

export function MessageAttachment({
  attachment,
  workspaceId,
  viewerIsOwner = false,
}: {
  attachment: Attachment;
  workspaceId: string;
  viewerIsOwner?: boolean;
}) {
  switch (attachment.type) {
    case "highlight": {
      const h = getSharedHighlight(attachment.highlightId);
      if (!h) return <p className="mt-1 text-[13px] text-subtle">Highlight này không còn.</p>;
      const onBoard = isHighlightOnBoard(workspaceId, h.id);
      return (
        <HighlightQuote
          className="mt-1.5"
          text={h.text}
          label={h.label}
          byline={`highlight từ workspace riêng của ${h.ownerName}`}
          actions={
            onBoard ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Check className="size-3.5" /> Đã đưa lên bảng
              </span>
            ) : viewerIsOwner ? (
              <form action={moveHighlightToBoard}>
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="highlightId" value={h.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-muted-foreground hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <SquareArrowUpRight className="size-3.5" /> Đưa lên bảng
                </button>
              </form>
            ) : null
          }
        />
      );
    }
    case "board-receipt": {
      const meta = ideaStatusMeta[attachment.status];
      return (
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-subtle">
          <Pin className="size-3.5" /> {attachment.text} ở cột
          <span className="font-medium text-muted-foreground">{meta.label.toLowerCase()}</span>
        </p>
      );
    }
    case "stats":
      return <StatsCard runId={attachment.runId} workspaceId={workspaceId} className="mt-1.5" />;
    case "run-progress":
      return (
        <RunProgressCard
          tasks={attachment.tasks}
          seconds={attachment.seconds}
          violations={attachment.violations}
          className="mt-1.5"
        />
      );
  }
}

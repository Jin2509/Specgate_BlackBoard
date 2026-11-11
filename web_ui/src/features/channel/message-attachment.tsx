// Phần đính kèm dưới tin nhắn: xác nhận ghi bảng, thẻ /stats, thẻ /run.
import { Pin } from "lucide-react";
import { ToneDot } from "@/components/common/tone-badge";
import { RunProgressCard } from "@/features/metrics/run-progress-card";
import { StatsCard } from "@/features/metrics/stats-card";
import { ideaStatusMeta } from "@/lib/status";
import type { Attachment } from "@/lib/types";

export function MessageAttachment({ attachment, workspaceId }: { attachment: Attachment; workspaceId: string }) {
  switch (attachment.type) {
    case "board-receipt": {
      const meta = ideaStatusMeta[attachment.status];
      return (
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-subtle">
          <Pin className="size-3.5" /> {attachment.text} ở trạng thái
          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
            <ToneDot tone={meta.tone} /> {meta.label.toLowerCase()}
          </span>
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

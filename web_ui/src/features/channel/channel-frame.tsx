// Khung kênh chat: thanh tiêu đề, vùng tin nhắn và khung bảng ý tưởng thu/phóng được.
"use client";

import { FileText, FlaskConical, Hash } from "lucide-react";
import type { ReactNode } from "react";
import { CollapsibleSidebar } from "@/components/common/collapsible-sidebar";
import { IconButton } from "@/components/common/icon-button";
import { PageHeader } from "@/components/common/page-header";
import { ToneBadge } from "@/components/common/tone-badge";

export function ChannelFrame({
  workspaceId,
  channelName,
  topic,
  hasAdom,
  viewerIsOwner,
  panel,
  children,
}: {
  workspaceId: string;
  channelName: string;
  topic: string;
  hasAdom: boolean;
  viewerIsOwner: boolean;
  panel: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-canvas">
      <PageHeader
        icon={<Hash />}
        title={channelName}
        meta={topic}
        actions={
          <>
            {hasAdom ? (
              <ToneBadge tone="data" className="mr-1 max-sm:hidden">
                <FlaskConical /> ADOM
              </ToneBadge>
            ) : null}
            <IconButton label={viewerIsOwner ? "Bản tổng hợp" : "Xem bản tổng hợp"} href={`/w/${workspaceId}/brief`}>
              <FileText />
            </IconButton>
          </>
        }
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        <CollapsibleSidebar side="right" breakpoint="lg" label="bảng ý tưởng" widthClassName="w-64">
          {panel}
        </CollapsibleSidebar>
      </div>
    </div>
  );
}

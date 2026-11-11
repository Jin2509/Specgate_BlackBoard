// Khung kênh chat: thanh tiêu đề, vùng tin nhắn và khung bảng ý tưởng bật/tắt được.
"use client";

import { FileText, FlaskConical, Hash, KanbanSquare, Lock, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { IconButton } from "@/components/common/icon-button";
import { PageHeader } from "@/components/common/page-header";
import { ToneBadge } from "@/components/common/tone-badge";

export function ChannelFrame({
  workspaceId,
  channelName,
  topic,
  personal,
  hasAdom,
  panel,
  children,
}: {
  workspaceId: string;
  channelName: string;
  topic: string;
  personal: boolean;
  hasAdom: boolean;
  panel: ReactNode;
  children: ReactNode;
}) {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-canvas">
      <PageHeader
        icon={<Hash />}
        title={channelName}
        meta={topic}
        actions={
          <>
            {personal ? (
              <ToneBadge tone="neutral" className="mr-1">
                <Lock /> Riêng tư
              </ToneBadge>
            ) : null}
            {hasAdom ? (
              <ToneBadge tone="data" className="mr-1">
                <FlaskConical /> ADOM
              </ToneBadge>
            ) : null}
            <IconButton label="Tóm tắt kênh">
              <Sparkles />
            </IconButton>
            <IconButton label="Bản tổng hợp" href={`/w/${workspaceId}/brief`}>
              <FileText />
            </IconButton>
            <IconButton
              label={showPanel ? "Ẩn bảng ý tưởng" : "Hiện bảng ý tưởng"}
              active={showPanel}
              onClick={() => setShowPanel((v) => !v)}
            >
              <KanbanSquare />
            </IconButton>
          </>
        }
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        {showPanel ? panel : null}
      </div>
    </div>
  );
}

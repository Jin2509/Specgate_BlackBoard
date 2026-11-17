"use client";
// Frames a channel: header bar, message area and the collapsible idea board column.
import { FileText, FlaskConical, Hash } from "lucide-react";
import type { ReactNode } from "react";

import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";
import { IconButton } from "@/components/IconButton";
import { PageHeader } from "@/components/PageHeader";
import { ToneBadge } from "@/components/ToneBadge";
import { t } from "@/lib/i18n";

export function ChannelFrame({
  workspaceId,
  channelName,
  topic,
  hasAdom,
  isViewerOwner,
  panel,
  children,
}: {
  workspaceId: string;
  channelName: string;
  topic: string;
  hasAdom: boolean;
  isViewerOwner: boolean;
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
            <IconButton label={isViewerOwner ? t.channel.briefOwner : t.channel.briefMember} href={`/w/${workspaceId}/brief`}>
              <FileText />
            </IconButton>
          </>
        }
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        <CollapsibleSidebar id="channel-board" side="right" breakpoint="lg" label={t.channel.boardSidebar} widthClassName="w-64">
          {panel}
        </CollapsibleSidebar>
      </div>
    </div>
  );
}

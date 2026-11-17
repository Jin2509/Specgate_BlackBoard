// Shows a shared workspace channel with the idea board beside it; new messages arrive over the backend's event stream.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AutoRefresh } from "@/components/AutoRefresh";
import { requireMe } from "@/features/auth/server";
import { BoardPanel, toBoardCards } from "@/features/board";
import { getBoard } from "@/features/board/server";
import { ChannelFrame, ChannelLive, Composer, MessageList } from "@/features/channel";
import { listMessages } from "@/features/channel/server";
import { listPrivateHighlights } from "@/features/personal/server";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { isApiError } from "@/lib/api/http-client";
import { format, t } from "@/lib/i18n";

const NOT_FOUND_STATUS = 404;
/** Fallback refresh in case the event stream cannot be opened. */
const FALLBACK_REFRESH_MS = 30_000;

export const metadata: Metadata = { title: t.workspace.channels };

export default function ChannelPage(props: PageProps<"/w/[workspaceId]/c/[channelName]">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ChannelPageContent {...props} />
    </Suspense>
  );
}

async function ChannelPageContent({ params }: PageProps<"/w/[workspaceId]/c/[channelName]">) {
  const workspace = await requireSharedWorkspace(params);
  const { channelName } = await params;
  const me = await requireMe();
  let page;
  try {
    page = await listMessages(workspace.id, channelName);
  } catch (error) {
    if (isApiError(error, NOT_FOUND_STATUS)) notFound();
    throw error;
  }
  const [board, privateHighlights] = await Promise.all([getBoard(workspace.id), listPrivateHighlights()]);
  const channel = page.channel;
  const people = workspace.members.map((member) => member.user);
  const agentCount = workspace.members.filter((member) => member.agent).length;
  // Chalk marks show only on passages the viewer highlighted themselves.
  const marksByMessageId: Record<string, string[]> = {};
  for (const highlight of page.myHighlights)
    for (const segment of highlight.segments)
      if (segment.part === null) (marksByMessageId[segment.messageId] ??= []).push(segment.text);

  return (
    <ChannelFrame
      workspaceId={workspace.id}
      channelName={channel.name}
      topic={format(t.channel.topic, { people: people.length, agents: agentCount })}
      hasAdom={workspace.modules?.includes("adom") ?? false}
      isViewerOwner={isOwner(workspace)}
      panel={<BoardPanel workspaceId={workspace.id} cards={toBoardCards(board)} />}
    >
      <ChannelLive workspaceId={workspace.id} channelId={channel.id} lastSeq={page.lastSeq} />
      <AutoRefresh intervalMs={FALLBACK_REFRESH_MS} />
      <MessageList
        messages={page.messages}
        workspaceId={workspace.id}
        channelId={channel.id}
        channelName={channel.name}
        viewerId={me.user.id}
        marksByMessageId={marksByMessageId}
      />
      <Composer
        workspaceId={workspace.id}
        channelId={channel.id}
        people={people.filter((person) => person.id !== me.user.id)}
        modules={workspace.modules ?? []}
        channelName={channel.name}
        highlights={privateHighlights.items}
        myName={workspace.myName ?? me.user.displayName}
      />
    </ChannelFrame>
  );
}

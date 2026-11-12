// Trang kênh chat của workspace chung, với bảng ý tưởng ở khung bên.
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { BoardPanel } from "@/features/channel/board-panel";
import { ChannelFrame } from "@/features/channel/channel-frame";
import { Composer } from "@/features/channel/composer/composer";
import { MessageList } from "@/features/channel/message-list";
import {
  getBoard,
  getHighlights,
  getMembers,
  getMessages,
  getTeamAgents,
  getWorkspace,
  getWorkspaceIds,
  isOwner,
} from "@/lib/mock/queries";
import { personalHome } from "@/lib/paths";
import { requireSession } from "@/lib/session";
import { requireWorkspace } from "@/lib/workspace-route";

export function generateStaticParams() {
  return getWorkspaceIds().flatMap((ws) => (getWorkspace(ws)?.channels ?? []).map((c) => ({ ws, channel: c.id })));
}

export default async function ChannelPage({ params }: PageProps<"/w/[ws]/c/[channel]">) {
  const ws = await requireWorkspace(params);
  if (ws.kind === "personal") redirect(personalHome(ws.id));
  const { channel: channelId } = await params;
  const channel = ws.channels.find((c) => c.id === channelId);
  if (!channel) notFound();

  const { user } = await requireSession();
  const owner = isOwner(ws, user.id);
  const people = getMembers(ws);
  const agents = getTeamAgents(ws);
  // Vệt phấn chỉ hiện ở những đoạn chính người xem đã highlight.
  const marks: Record<string, string[]> = {};
  for (const h of getHighlights(user.id, ws.id).filter((x) => x.channelId === channel.id)) {
    (marks[h.messageId] ??= []).push(h.text);
  }

  return (
    <ChannelFrame
      workspaceId={ws.id}
      channelName={channel.name}
      topic={`${people.length} người, ${agents.length} agent riêng`}
      hasAdom={ws.modules.includes("adom")}
      viewerIsOwner={owner}
      panel={<BoardPanel workspaceId={ws.id} items={getBoard(ws.id)} />}
    >
      <AutoRefresh intervalMs={8000} />
      <MessageList
        messages={getMessages(ws.id, channel.id)}
        workspaceId={ws.id}
        channelName={channel.name}
        viewerId={user.id}
        marks={marks}
      />
      <Composer
        workspaceId={ws.id}
        channelId={channel.id}
        people={people.filter((p) => p.id !== user.id)}
        modules={ws.modules}
        channelName={channel.name}
      />
    </ChannelFrame>
  );
}

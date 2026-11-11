// Trang kênh chat với bảng ý tưởng ở khung bên.
import { notFound } from "next/navigation";
import { BoardPanel } from "@/features/channel/board-panel";
import { ChannelFrame } from "@/features/channel/channel-frame";
import { Composer } from "@/features/channel/composer/composer";
import { MessageList } from "@/features/channel/message-list";
import { getAgents, getBoard, getMembers, getMessages, getWorkspace, getWorkspaceIds } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { requireWorkspace } from "@/lib/workspace-route";

export function generateStaticParams() {
  return getWorkspaceIds().flatMap((ws) => (getWorkspace(ws)?.channels ?? []).map((c) => ({ ws, channel: c.id })));
}

export default async function ChannelPage({ params }: PageProps<"/w/[ws]/c/[channel]">) {
  const ws = await requireWorkspace(params);
  const { channel: channelId } = await params;
  const channel = ws.channels.find((c) => c.id === channelId);
  if (!channel) notFound();

  const { user } = await requireSession();
  const personal = ws.kind === "personal";
  const people = getMembers(ws);
  const agents = getAgents(ws).filter((a) => a.enabled);

  return (
    <ChannelFrame
      workspaceId={ws.id}
      channelName={channel.name}
      topic={personal ? "Chỉ mình bạn thấy kênh này" : `${people.length} người · ${agents.length} agent`}
      personal={personal}
      hasAdom={ws.modules.includes("adom")}
      panel={
        <BoardPanel workspaceId={ws.id} items={getBoard(ws.id)} explorePath={personal ? `/w/${ws.id}/explore` : undefined} />
      }
    >
      <MessageList messages={getMessages(ws.id, channel.id)} workspaceId={ws.id} channelName={channel.name} />
      <Composer agents={agents} people={people.filter((p) => p.id !== user.id)} modules={ws.modules} channelName={channel.name} />
    </ChannelFrame>
  );
}

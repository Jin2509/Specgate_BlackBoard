// Hiển thị một tin nhắn của người hoặc agent.
import { CornerUpRight } from "lucide-react";
import { ActorAvatar, AiTag } from "@/components/common/actor-avatar";
import { getAgent, getProfile } from "@/lib/mock/queries";
import { agentRoleMeta } from "@/lib/status";
import type { Message } from "@/lib/types";
import { MessageAttachment } from "./message-attachment";
import { MessageSegment } from "./message-segment";

export function MessageItem({ message, workspaceId }: { message: Message; workspaceId: string }) {
  const isAgent = message.senderKind === "agent";
  const agent = isAgent ? getAgent(message.senderId) : undefined;
  const person = !isAgent ? getProfile(message.senderId) : undefined;

  return (
    <article className="group relative mt-4 py-0.5 pr-12 pl-18 hover:bg-hover">
      {message.replyTo ? (
        <p className="mb-1 flex items-center gap-1.5 text-[13px] text-subtle">
          <CornerUpRight className="absolute left-9 size-4 -scale-y-100" />
          <span className="font-medium text-muted-foreground">@{getAgent(message.replyTo.senderId)?.handle}</span>
          <span className="truncate">{message.replyTo.excerpt}</span>
        </p>
      ) : null}
      <ActorAvatar kind={isAgent ? "agent" : "human"} initial={person?.initial} className="absolute left-4 mt-0.5" />
      <header className="flex flex-wrap items-center gap-x-1.5 leading-5.5">
        <span className={isAgent ? "font-medium text-agent" : "font-medium text-sidebar-accent-foreground"}>
          {agent ? agent.handle : person?.displayName}
        </span>
        {agent ? (
          <>
            <AiTag />
            <span className="text-xs text-subtle">
              {agentRoleMeta[agent.role].label} · <span className="font-mono">{agent.model}</span>
            </span>
          </>
        ) : null}
        <time className="text-xs text-subtle">hôm nay lúc {message.at}</time>
      </header>

      {message.body.length > 0 ? (
        <p className="text-[15px] leading-[1.375rem] text-foreground">
          {message.body.map((seg, i) => (
            <MessageSegment key={i} seg={seg} />
          ))}
          {message.streaming ? <span className="stream-caret" aria-label="đang trả lời" /> : null}
        </p>
      ) : null}

      {message.list ? (
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[15px] leading-[1.375rem] text-foreground">
          {message.list.map((li) => (
            <li key={li}>{li}</li>
          ))}
        </ol>
      ) : null}

      {message.attachment ? <MessageAttachment attachment={message.attachment} workspaceId={workspaceId} /> : null}
    </article>
  );
}

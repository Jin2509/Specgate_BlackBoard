// Hiển thị một tin nhắn của người, agent (ghi rõ agent của ai) hoặc hệ thống.
// Đoạn người xem đã highlight được tô vệt phấn; chỉ người đó thấy.
import { Info } from "lucide-react";
import { ActorAvatar, AiTag } from "@/components/common/actor-avatar";
import { withMarks } from "@/features/personal/turn-text";
import { getProfile, isOwnMessage, speakerLabel } from "@/lib/mock/queries";
import type { Message } from "@/lib/types";
import { MessageAttachment } from "./message-attachment";
import { MessageSegment } from "./message-segment";

export function MessageItem({
  message,
  workspaceId,
  viewerId,
  marks = [],
}: {
  message: Message;
  workspaceId: string;
  viewerId: string;
  marks?: string[];
}) {
  if (message.senderKind === "system") {
    return (
      <p className="mt-3 flex items-start gap-2 py-0.5 pr-12 pl-18 text-[13.5px] text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-subtle" />
        <span>
          {message.body.map((seg, i) => (
            <MessageSegment key={i} seg={seg} />
          ))}
        </span>
      </p>
    );
  }

  const isAgent = message.senderKind === "agent";
  const owner = getProfile(message.senderId);

  return (
    <article
      data-message-id={message.id}
      data-channel-id={message.channelId}
      data-speaker={speakerLabel(message)}
      data-own={isOwnMessage(message, viewerId)}
      className="group relative mt-4 py-0.5 pr-12 pl-18 hover:bg-hover"
    >
      <ActorAvatar
        kind={isAgent ? "agent" : "human"}
        initial={isAgent ? message.agentModel : owner?.initial}
        className="absolute left-4 mt-0.5"
      />
      <header className="flex flex-wrap items-center gap-x-1.5 leading-5.5">
        {isAgent ? (
          <>
            <span className="font-mono text-[14px] font-medium text-agent">{message.agentModel}</span>
            <AiTag />
            <span className="text-xs text-subtle">
              của <span className="font-medium text-muted-foreground">{owner?.displayName}</span>, gửi từ workspace riêng
            </span>
          </>
        ) : (
          <span className="font-medium text-sidebar-accent-foreground">{owner?.displayName}</span>
        )}
        <time className="text-xs text-subtle">hôm nay lúc {message.at}</time>
      </header>

      {message.body.length > 0 ? (
        <p className="text-[15px] leading-[1.375rem] whitespace-pre-line text-foreground">
          {message.body.map((seg, i) =>
            seg.t === "text" ? <span key={i}>{withMarks(seg.v, marks)}</span> : <MessageSegment key={i} seg={seg} />,
          )}
          {message.streaming ? <span className="stream-caret" aria-label="đang trả lời" /> : null}
        </p>
      ) : null}

      {message.list ? (
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[15px] leading-[1.375rem] text-foreground">
          {message.list.map((li) => (
            <li key={li}>{withMarks(li, marks)}</li>
          ))}
        </ol>
      ) : null}

      {message.attachment ? <MessageAttachment attachment={message.attachment} workspaceId={workspaceId} /> : null}
    </article>
  );
}

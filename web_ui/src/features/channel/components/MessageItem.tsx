// Renders one channel message (a person's words with cards, or a system line), with the viewer's chalk marks.
import { CornerDownRight, Info } from "lucide-react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { AiTag } from "@/components/AiTag";
import { MarkedText } from "@/components/MarkedText";
import { format, t } from "@/lib/i18n";
import type { Message } from "@/types/message";
import { toAvatarColor } from "@/utils/avatar-color";
import { toClock } from "@/utils/date-format";

import { MessageAttachment } from "./MessageAttachment";
import { MessageCards } from "./MessageCards";
import { MessageSegment } from "./MessageSegment";

/** Whether the message is already in the viewer's agent context; a channel summary (/summarize) is not. */
export function isOwnMessage(message: Pick<Message, "senderKind" | "senderId" | "attachment">, viewerId: string): boolean {
  return message.senderKind !== "system" && message.senderId === viewerId && message.attachment?.type !== "summary";
}

function toNameTitle(message: Message): string | undefined {
  const sender = message.sender;
  if (!sender) return undefined;
  const accountName =
    sender.accountName && sender.accountName !== sender.displayName
      ? format(t.channel.accountNameTitle, { name: sender.accountName })
      : null;
  return [accountName, sender.account].filter(Boolean).join(" · ") || undefined;
}

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
  const isOwn = isOwnMessage(message, viewerId);
  const cards = message.cards ?? [];

  if (message.senderKind === "system") {
    return (
      <div
        data-message-id={cards.length ? message.id : undefined}
        data-channel-id={message.channelId}
        data-speaker={t.channel.systemSpeaker}
        data-own="false"
        data-system="true"
        className="mt-3 flex items-start gap-2 py-0.5 pr-12 pl-18 text-[0.84375rem] text-muted-foreground"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-subtle" />
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line" data-no-select={cards.length ? true : undefined}>
            {message.body.map((segment, index) => (
              <MessageSegment key={index} segment={segment} />
            ))}
          </p>
          {message.attachment ? <MessageAttachment attachment={message.attachment} workspaceId={workspaceId} /> : null}
          {cards.length ? <MessageCards cards={cards} /> : null}
        </div>
      </div>
    );
  }

  const isAgent = message.senderKind === "agent";
  const isChannelSummary = message.attachment?.type === "summary";
  const owner = message.sender;
  const ownerTint = toAvatarColor(owner?.color);

  return (
    <article
      data-message-id={message.id}
      data-channel-id={message.channelId}
      data-speaker={isChannelSummary ? format(t.channel.channelSummarySpeaker, { name: message.senderName }) : message.senderName}
      data-own={isOwn}
      className="group relative mt-4 py-0.5 pr-12 pl-18 hover:bg-hover"
    >
      <ActorAvatar
        kind={isAgent ? "agent" : "human"}
        initial={isAgent ? message.agentName : owner?.initial}
        colorIndex={owner?.color}
        title={toNameTitle(message)}
        className="absolute left-4 mt-0.5"
      />
      {message.replyTo ? (
        <p className="mb-0.5 flex items-center gap-1 truncate text-xs text-subtle" data-no-select>
          <CornerDownRight className="size-3" />{" "}
          {format(t.channel.replyTo, { speaker: message.replyTo.speaker, text: message.replyTo.text })}
        </p>
      ) : null}
      <header className="flex flex-wrap items-center gap-x-1.5 leading-5.5" data-no-select>
        {isAgent ? (
          <>
            <span className="text-[0.875rem] font-semibold text-agent" style={ownerTint ? { color: ownerTint } : undefined}>
              {message.senderName}
            </span>
            <AiTag />
            <span className="font-mono text-xs text-subtle">{message.agentModel}</span>
            {isChannelSummary ? <span className="text-xs text-subtle">{t.channel.channelSummaryTag}</span> : null}
          </>
        ) : (
          <span
            title={toNameTitle(message)}
            className="font-semibold text-sidebar-accent-foreground"
            style={ownerTint ? { color: ownerTint } : undefined}
          >
            {owner?.displayName}
          </span>
        )}
        <time dateTime={message.at} className="text-xs text-subtle">
          {toClock(message.at)}
        </time>
      </header>

      {message.body.length > 0 ? (
        <p data-part-body className="text-[0.9375rem] leading-[1.375rem] whitespace-pre-line text-foreground">
          {message.body.map((segment, index) =>
            segment.t === "text" ? (
              <span key={index}>
                <MarkedText text={segment.v} marks={marks} />
              </span>
            ) : (
              <MessageSegment key={index} segment={segment} />
            ),
          )}
        </p>
      ) : null}

      {cards.length ? <MessageCards cards={cards} ownerColor={owner?.color} /> : null}
      {message.attachment && !isChannelSummary ? (
        <MessageAttachment attachment={message.attachment} workspaceId={workspaceId} />
      ) : null}
    </article>
  );
}

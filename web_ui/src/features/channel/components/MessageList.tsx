// Lists a channel's messages after the channel introduction, scrolling to the newest one.
import { Hash } from "lucide-react";

import { t } from "@/lib/i18n";
import type { Message } from "@/types/message";

import { HighlightableList } from "./HighlightableList";
import { MessageItem } from "./MessageItem";

/** The newest messages fill the first screen, so they render at once; older ones wait until scrolled near. */
const EAGER_MESSAGE_COUNT = 30;

export function MessageList({
  messages,
  workspaceId,
  channelId,
  channelName,
  viewerId,
  marksByMessageId,
}: {
  messages: Message[];
  workspaceId: string;
  channelId: string;
  channelName: string;
  viewerId: string;
  marksByMessageId: Record<string, string[]>;
}) {
  return (
    <HighlightableList
      workspaceId={workspaceId}
      channelId={channelId}
      watch={messages.length}
      className="flex flex-1 scrollbar-thin flex-col overflow-y-auto"
    >
      <div className="px-4 pt-6 pb-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-sidebar-accent-foreground">
          <Hash className="size-8" />
        </span>
        <h2 className="mt-3 text-2xl font-bold text-sidebar-accent-foreground">#{channelName}</h2>
        <p className="mt-1 max-w-xl text-sm text-subtle">{t.channel.intro}</p>
      </div>
      {messages.length > 0 ? <div aria-hidden className="mx-4 mb-2 h-px bg-border" /> : null}
      <div className="pb-4">
        {messages.map((message, index) => (
          <div key={message.id} className={index < messages.length - EAGER_MESSAGE_COUNT ? "render-when-visible" : undefined}>
            <MessageItem message={message} workspaceId={workspaceId} viewerId={viewerId} marks={marksByMessageId[message.id]} />
          </div>
        ))}
      </div>
    </HighlightableList>
  );
}

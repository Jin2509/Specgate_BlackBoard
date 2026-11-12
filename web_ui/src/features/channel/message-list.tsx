// Danh sách tin nhắn của kênh chung, mở đầu bằng phần giới thiệu kênh. Tự cuộn xuống tin mới nhất.
import { Hash } from "lucide-react";
import type { Message } from "@/lib/types";
import { MessageItem } from "./message-item";
import { ScrollToEnd } from "./scroll-to-end";

export function MessageList({
  messages,
  workspaceId,
  channelName,
  viewerIsOwner = false,
}: {
  messages: Message[];
  workspaceId: string;
  channelName: string;
  viewerIsOwner?: boolean;
}) {
  return (
    <ScrollToEnd watch={messages.length} className="flex flex-1 scrollbar-thin flex-col overflow-y-auto">
      <div className="mt-auto px-4 pt-6 pb-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-sidebar-accent-foreground">
          <Hash className="size-8" />
        </span>
        <h2 className="mt-3 text-2xl font-bold text-sidebar-accent-foreground">#{channelName}</h2>
        <p className="mt-1 max-w-xl text-sm text-subtle">
          Gõ <span className="font-medium text-muted-foreground">@</span> để gọi agent, nhắc người hoặc đính kèm highlight từ
          workspace riêng. Gõ <span className="font-medium text-muted-foreground">/</span> để dùng lệnh.
        </p>
      </div>
      {messages.length > 0 ? <div aria-hidden className="mx-4 mb-2 h-px bg-border" /> : null}
      <div className="pb-4">
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} workspaceId={workspaceId} viewerIsOwner={viewerIsOwner} />
        ))}
      </div>
    </ScrollToEnd>
  );
}

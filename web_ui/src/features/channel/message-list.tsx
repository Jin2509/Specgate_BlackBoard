// Danh sách tin nhắn của kênh, mở đầu bằng lời chào của kênh.
import { Hash } from "lucide-react";
import type { Message } from "@/lib/types";
import { MessageItem } from "./message-item";

export function MessageList({
  messages,
  workspaceId,
  channelName,
}: {
  messages: Message[];
  workspaceId: string;
  channelName: string;
}) {
  return (
    <div className="flex flex-1 scrollbar-thin flex-col overflow-y-auto">
      <div className="mt-auto px-4 pt-6 pb-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-sidebar-accent-foreground">
          <Hash className="size-10" />
        </span>
        <h2 className="mt-3 text-2xl font-bold text-sidebar-accent-foreground">Chào mừng tới #{channelName}!</h2>
        <p className="mt-1 text-sm text-subtle">
          Đây là đầu kênh. Gõ <span className="font-medium text-muted-foreground">@</span> để gọi một agent,{" "}
          <span className="font-medium text-muted-foreground">/</span> để dùng lệnh.
        </p>
      </div>
      {messages.length > 0 ? <div aria-hidden className="mx-4 mb-2 h-px bg-border" /> : null}
      <div className="pb-4">
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} workspaceId={workspaceId} />
        ))}
      </div>
    </div>
  );
}

// Danh sách tin nhắn của kênh chung, mở đầu bằng phần giới thiệu kênh. Tự cuộn xuống tin mới nhất.
import { Hash } from "lucide-react";
import type { Message } from "@/lib/types";
import { HighlightableList } from "./highlightable-list";
import { MessageItem } from "./message-item";

export function MessageList({
  messages,
  workspaceId,
  channelName,
  viewerId,
  marks,
}: {
  messages: Message[];
  workspaceId: string;
  channelName: string;
  viewerId: string;
  marks: Record<string, string[]>;
}) {
  return (
    <HighlightableList
      workspaceId={workspaceId}
      watch={messages.length}
      className="flex flex-1 scrollbar-thin flex-col overflow-y-auto"
    >
      <div className="px-4 pt-6 pb-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-sidebar-accent-foreground">
          <Hash className="size-8" />
        </span>
        <h2 className="mt-3 text-2xl font-bold text-sidebar-accent-foreground">#{channelName}</h2>
        <p className="mt-1 max-w-xl text-sm text-subtle">
          Agent của mỗi người làm việc ở workspace riêng của người đó; câu trả lời được gửi vào đây dưới tên agent của ai. Bôi đen
          một đoạn trong tin của người khác để agent của bạn đọc được. Tin của bạn thì agent tự đọc.
        </p>
      </div>
      {messages.length > 0 ? <div aria-hidden className="mx-4 mb-2 h-px bg-border" /> : null}
      <div className="pb-4">
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} workspaceId={workspaceId} viewerId={viewerId} marks={marks[m.id]} />
        ))}
      </div>
    </HighlightableList>
  );
}

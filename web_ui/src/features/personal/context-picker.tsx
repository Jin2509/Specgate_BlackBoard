// Chọn workspace chung làm ngữ cảnh nhóm cho hội thoại riêng. Đổi là lưu ngay.
// Gắn rồi thì agent đọc được đội, bảng ý tưởng, tin của bạn và các đoạn bạn highlight ở workspace đó,
// và câu trả lời gửi được vào kênh của workspace đó.
"use client";

import { Users } from "lucide-react";
import { useRef } from "react";
import { linkWorkspace } from "@/lib/private-actions";
import { cn } from "@/lib/utils";

export interface WorkspaceOption {
  id: string;
  name: string;
}

const SELECT =
  "h-8 max-w-48 truncate rounded-md border border-border bg-input px-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContextPicker({
  conversationId,
  value,
  options,
  className,
}: {
  conversationId: string;
  value?: string;
  options: WorkspaceOption[];
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={linkWorkspace} className={cn("flex items-center gap-1.5", className)}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <label htmlFor="ctx-ws" className="flex items-center gap-1 text-[13px] text-subtle">
        <Users className="size-4" />
        <span className="max-sm:sr-only">Ngữ cảnh nhóm</span>
      </label>
      <select
        id="ctx-ws"
        name="workspaceId"
        defaultValue={value ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        className={SELECT}
      >
        <option value="">Không gắn</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </form>
  );
}

// Bản dùng trong ô hỏi của hội thoại mới: chưa có hội thoại để lưu, nên chỉ gửi kèm câu hỏi đầu tiên.
export function NewChatContextSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (id: string) => void;
  options: WorkspaceOption[];
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-subtle">
      <Users className="size-3.5" />
      <span className="sr-only">Ngữ cảnh nhóm</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(SELECT, "h-7 text-xs")}>
        <option value="">Không gắn workspace chung</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            Ngữ cảnh: {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}

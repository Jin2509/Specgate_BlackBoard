// Hộp thoại gửi câu trả lời của agent riêng vào kênh chung: sửa đoạn gửi (lọc bớt), chọn kênh, xem tin sẽ hiện dưới tên gì.
// Thay cho việc copy câu trả lời rồi dán vào chat nhóm.
"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendReplyToChannel } from "@/lib/private-actions";
import type { Channel } from "@/lib/types";

export interface SendDraft {
  conversationId: string;
  turnId: string;
  model: string;
  text: string;
}

export function SendToChannelDialog({
  draft,
  workspaceName,
  channels,
  onClose,
  onSent,
}: {
  draft: SendDraft | null;
  workspaceName: string;
  channels: Channel[];
  onClose: () => void;
  onSent: (channel: Channel) => void;
}) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        {draft ? (
          <DraftForm
            key={`${draft.turnId}:${draft.text}`}
            draft={draft}
            workspaceName={workspaceName}
            channels={channels}
            onClose={onClose}
            onSent={onSent}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DraftForm({
  draft,
  workspaceName,
  channels,
  onClose,
  onSent,
}: {
  draft: SendDraft;
  workspaceName: string;
  channels: Channel[];
  onClose: () => void;
  onSent: (channel: Channel) => void;
}) {
  const [text, setText] = useState(draft.text);
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send() {
    start(async () => {
      const result = await sendReplyToChannel({ conversationId: draft.conversationId, turnId: draft.turnId, channelId, text });
      const channel = channels.find((c) => c.id === channelId);
      if (result.ok && channel) onSent(channel);
      else setError(result.ok ? "Không tìm thấy kênh." : result.error);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Gửi vào kênh của {workspaceName}</DialogTitle>
        <DialogDescription>
          Tin hiện dưới tên <span className="font-mono text-[13px] text-agent">{draft.model}</span> của bạn. Mọi thành viên đọc
          được đoạn này, không ai mở được hội thoại riêng của bạn.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="send-text" className="text-[13px] font-semibold text-muted-foreground">
          Nội dung gửi (bớt phần không cần thiết)
        </Label>
        <Textarea id="send-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="send-channel" className="text-[13px] font-semibold text-muted-foreground">
          Kênh
        </Label>
        <select
          id="send-channel"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="h-9 w-48 rounded-md border border-border bg-input px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={send} disabled={pending || !text.trim() || !channelId}>
          {pending ? <LoaderCircle className="animate-spin" /> : null} Gửi vào kênh
        </Button>
      </DialogFooter>
    </>
  );
}

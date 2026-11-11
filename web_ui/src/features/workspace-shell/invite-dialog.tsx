// Hộp thoại mời người khác vào workspace chung bằng liên kết.
"use client";

import { Check, Copy } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Invite } from "@/lib/types";

const subscribe = () => () => {};

export function InviteDialog({
  open,
  onOpenChange,
  workspaceName,
  invite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  invite: Invite | undefined;
}) {
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const link = invite ? `${origin}/invite/${invite.code}` : "";

  async function copy() {
    await navigator.clipboard?.writeText(link);
    setCopied(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Mời người khác vào {workspaceName}</DialogTitle>
          <DialogDescription>
            Ai có liên kết này đều vào thẳng workspace, không cần chờ duyệt. Muốn duyệt từng người, để họ xin tham gia từ trang
            Khám phá.
          </DialogDescription>
        </DialogHeader>
        {invite ? (
          <div className="grid gap-2">
            <Label htmlFor="invite-link" className="text-xs font-bold tracking-wide text-subtle uppercase">
              Liên kết mời
            </Label>
            <div className="flex items-center gap-2 rounded-md bg-input p-1 pl-3">
              <input
                id="invite-link"
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
              />
              <Button size="sm" onClick={copy} className={copied ? "bg-decided hover:bg-decided" : undefined}>
                {copied ? <Check /> : <Copy />} {copied ? "Đã chép" : "Sao chép"}
              </Button>
            </div>
            <p className="text-xs text-subtle">
              Hết hạn ngày {invite.expiresAt} · đã dùng {invite.uses} lần
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Workspace này chưa có liên kết mời.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

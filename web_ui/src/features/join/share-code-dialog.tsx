// Hộp thoại chia sẻ mã tham gia của workspace chung; chủ workspace có thể đổi mã.
"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { JoinCode } from "@/lib/types";
import { JoinCodeDisplay, RegenerateCodeButton } from "./join-code-display";

export function ShareCodeDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  joinCode,
  isOwner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  joinCode: JoinCode | undefined;
  isOwner: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy() {
    if (!joinCode) return;
    await navigator.clipboard?.writeText(joinCode.code);
    setCopied(joinCode.code);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Mời người khác vào {workspaceName}</DialogTitle>
          <DialogDescription>
            Gửi mã này cho người muốn tham gia. Họ bấm nút chìa khóa ở thanh bên trái, nhập mã, rồi chờ chủ workspace duyệt.
          </DialogDescription>
        </DialogHeader>
        {joinCode ? (
          <div className="grid gap-3">
            <JoinCodeDisplay code={joinCode.code} />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={copy} className={copied === joinCode.code ? "bg-decided hover:bg-decided" : undefined}>
                {copied === joinCode.code ? <Check /> : <Copy />} {copied === joinCode.code ? "Đã chép mã" : "Sao chép mã"}
              </Button>
              {isOwner ? <RegenerateCodeButton workspaceId={workspaceId} /> : null}
            </div>
            <p className="text-xs text-subtle">
              Tạo lúc {joinCode.createdAt}.{" "}
              {isOwner ? "Đổi mã khi mã bị lộ: mã cũ hết hiệu lực ngay." : "Chỉ chủ workspace đổi được mã."}
            </p>
          </div>
        ) : isOwner ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">Workspace chưa có mã tham gia.</p>
            <RegenerateCodeButton workspaceId={workspaceId} label="Tạo mã" icon={<RefreshCw />} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Workspace chưa có mã tham gia. Nhờ chủ workspace tạo mã.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

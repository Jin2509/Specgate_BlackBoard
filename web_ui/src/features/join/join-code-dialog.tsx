// Hộp thoại "Tham gia bằng mã" mở từ thanh workspace.
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JoinCodeForm } from "./join-code-form";

export function JoinCodeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Tham gia workspace chung bằng mã</DialogTitle>
          <DialogDescription>
            Nhập mã 7 ký tự mà một thành viên đã chia sẻ. Yêu cầu của bạn chờ chủ workspace xác nhận.
          </DialogDescription>
        </DialogHeader>
        {open ? <JoinCodeForm autoFocus /> : null}
      </DialogContent>
    </Dialog>
  );
}

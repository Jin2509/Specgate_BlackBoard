// Hộp thoại tạo workspace chung (màn 03).
"use client";

import { Bot, Compass, EyeOff, FlaskConical, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl, type SegmentOption } from "@/components/common/segmented-control";
import { ToneBadge } from "@/components/common/tone-badge";
import { agentRoleMeta } from "@/lib/status";
import type { AgentRole, Visibility } from "@/lib/types";
import { cn } from "@/lib/utils";

const VISIBILITY_OPTIONS: SegmentOption<Visibility>[] = [
  {
    value: "hidden",
    label: (
      <>
        <EyeOff className="size-3.5" /> Ẩn, không ai tìm thấy
      </>
    ),
  },
  {
    value: "discoverable",
    label: (
      <>
        <Compass className="size-3.5" /> Ai cũng tìm thấy, vào phải xin
      </>
    ),
  },
];

const TEMPLATE_ROLES: AgentRole[] = ["generator", "critic", "synthesizer"];

export function CreateWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("Nghiên cứu ADOM");
  const [brief, setBrief] = useState(
    "Làm sao để tiêu chí 3 có dữ liệu ở lượt chạy sau, mà không vi phạm kỷ luật thực nghiệm của bài báo.",
  );
  const [visibility, setVisibility] = useState<Visibility>("discoverable");
  const [adom, setAdom] = useState(true);
  const canSubmit = name.trim().length > 0 && brief.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-130"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          document.getElementById("ws-brief")?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Tạo workspace chung</DialogTitle>
          <DialogDescription>Nơi cả nhóm và các agent cùng làm việc trên một đề bài.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ws-name">Tên</Label>
            <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-brief">
              Đề bài <span className="font-normal text-muted-foreground">· bắt buộc, mọi agent đọc phần này trước tiên</span>
            </Label>
            <Textarea id="ws-brief" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>Ai tìm thấy workspace này</Label>
            <SegmentedControl
              aria-label="Ai tìm thấy workspace này"
              value={visibility}
              onChange={setVisibility}
              options={VISIBILITY_OPTIONS}
              className="grid grid-cols-2 gap-1 p-1"
              itemClassName="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs"
            />
            <p className="text-[11px] text-subtle">Liên kết mời nằm ở danh sách chờ; đợt này chỉ vào bằng yêu cầu tham gia.</p>
          </div>

          <div className="grid gap-1.5">
            <Label>Agent có sẵn</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {TEMPLATE_ROLES.map((r) => (
                <ToneBadge key={r} tone="agent">
                  <Bot /> {agentRoleMeta[r].label}
                </ToneBadge>
              ))}
              <span className="text-[11px] text-subtle">Thêm khóa API sau, ở phần cài đặt.</span>
            </div>
          </div>

          <AdomToggle checked={adom} onCheckedChange={setAdom} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button disabled={!canSubmit} onClick={() => onOpenChange(false)}>
            <Plus /> Tạo workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdomToggle({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg bg-input p-3 transition-colors",
        checked && "ring-1 ring-data-line",
      )}
    >
      <FlaskConical className="mt-0.5 size-4 text-data" />
      <span className="flex-1">
        <span className="block text-sm font-medium">Gắn dữ kiện ADOM</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          Thêm bảng số liệu và các lệnh <code className="font-mono text-data">/stats</code>{" "}
          <code className="font-mono text-data">/task</code> <code className="font-mono text-data">/run</code>. Bỏ qua nếu đề bài
          không liên quan tới bài báo.
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label="Gắn dữ kiện ADOM" />
    </label>
  );
}

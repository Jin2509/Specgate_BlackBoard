// Form xin tham gia kèm lời nhắn và gói ngữ cảnh.
"use client";

import Link from "next/link";
import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BoardCard, JoinRelation, Workspace } from "@/lib/types";
import { CapsulePicker } from "./capsule-picker";

export function JoinRequestForm({
  target,
  relation,
  capsuleCandidates,
}: {
  target: Workspace;
  relation: JoinRelation;
  capsuleCandidates: BoardCard[];
}) {
  const [message, setMessage] = useState("Mình có vài hướng kiểm thử có thể áp dụng cho tiêu chí 3.");
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(capsuleCandidates.filter((i) => i.kind === "idea").map((i) => i.id)),
  );
  const [withSummary, setWithSummary] = useState(true);

  function toggle(id: string, on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (relation === "member") {
    return (
      <section className="rounded-lg bg-card p-4">
        <h2 className="font-semibold text-sidebar-accent-foreground">Bạn đã ở trong “{target.name}”</h2>
        <Button asChild className="mt-3">
          <Link href={`/w/${target.id}/c/chung`}>Mở workspace</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-col rounded-lg bg-card p-4">
      <p className="text-xs font-bold tracking-wide text-subtle uppercase">Xin tham gia</p>
      <h2 className="mt-1 text-lg font-semibold text-sidebar-accent-foreground">{target.name}</h2>
      <p className="mt-1 text-[13px] text-subtle">Chủ workspace duyệt yêu cầu. Có liên kết mời thì vào thẳng, không cần chờ.</p>

      <div className="mt-4 grid gap-1.5">
        <Label htmlFor="join-msg" className="text-xs font-bold tracking-wide text-subtle uppercase">
          Lời nhắn cho chủ workspace
        </Label>
        <Input id="join-msg" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <p className="mt-4 mb-1 text-xs font-bold tracking-wide text-subtle uppercase">Mang theo từ workspace riêng</p>
      <CapsulePicker items={capsuleCandidates} picked={picked} onToggle={toggle} />
      <label className="mt-2 flex items-center gap-2 px-2 text-[13px] text-muted-foreground">
        <Checkbox checked={withSummary} onCheckedChange={(v) => setWithSummary(Boolean(v))} />
        Kèm bản tóm tắt kênh riêng
      </label>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <p className="text-xs text-subtle">Người duyệt thấy đúng {picked.size + (withSummary ? 1 : 0)} mục bạn chọn.</p>
        <Button>
          <SendHorizontal /> {relation === "pending" ? "Cập nhật yêu cầu" : "Gửi yêu cầu"}
        </Button>
      </div>
    </section>
  );
}

// Form xin tham gia một workspace chung, kèm lời nhắn cho chủ workspace.
"use client";

import Link from "next/link";
import { Clock, LoaderCircle, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendJoinRequest } from "@/lib/join-actions";
import { sharedHome } from "@/lib/paths";
import type { JoinRelation, Workspace } from "@/lib/types";

export function JoinRequestForm({
  target,
  relation,
  pendingRequestId,
}: {
  target: Workspace;
  relation: JoinRelation;
  pendingRequestId?: string;
}) {
  const [message, setMessage] = useState("");

  if (relation === "member") {
    return (
      <section className="rounded-lg bg-card p-4">
        <h2 className="font-semibold text-sidebar-accent-foreground">Bạn đã ở trong “{target.name}”</h2>
        <Button asChild className="mt-3">
          <Link href={sharedHome(target.id)}>Mở workspace</Link>
        </Button>
      </section>
    );
  }

  return (
    <form action={sendJoinRequest} className="flex min-h-0 flex-col self-start rounded-lg bg-card p-4">
      <input type="hidden" name="workspaceId" value={target.id} />
      <h2 className="text-lg font-semibold text-sidebar-accent-foreground">Xin vào {target.name}</h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{target.brief}</p>
      {relation === "pending" && pendingRequestId ? (
        <Link
          href={`/join/${pendingRequestId}`}
          className="mt-3 flex items-center gap-2 rounded-md bg-proposed-soft px-3 py-2 text-[13px] text-foreground hover:underline"
        >
          <Clock className="size-4 text-proposed" /> Bạn đã gửi yêu cầu và đang chờ duyệt. Xem trạng thái
        </Link>
      ) : null}

      <div className="mt-4 grid gap-1.5">
        <Label htmlFor="join-msg" className="text-[13px] font-semibold text-muted-foreground">
          Lời nhắn cho chủ workspace
        </Label>
        <Textarea
          id="join-msg"
          name="message"
          rows={3}
          value={message}
          placeholder="Bạn là ai, muốn góp gì cho đề bài này"
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-subtle">
        Chủ workspace duyệt rồi bạn mới vào được. Sau khi vào, đưa những đoạn đáng bàn từ workspace riêng bằng highlight.
      </p>
      <div className="mt-4 flex justify-end">
        <SubmitButton label={relation === "pending" ? "Cập nhật lời nhắn" : "Gửi yêu cầu"} />
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="animate-spin" /> : <SendHorizontal />} {label}
    </Button>
  );
}

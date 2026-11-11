// Thẻ một yêu cầu tham gia đang chờ duyệt.
import { Bot, Check, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActorAvatar } from "@/components/common/actor-avatar";
import { ToneBadge } from "@/components/common/tone-badge";
import type { BoardCard, JoinRequest, Profile } from "@/lib/types";

export function PendingRequestCard({
  request,
  requester,
  capsuleItems,
}: {
  request: JoinRequest;
  requester: Profile;
  capsuleItems: BoardCard[];
}) {
  return (
    <section className="rounded-lg bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ActorAvatar kind="human" initial={requester.initial} />
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-semibold text-sidebar-accent-foreground">{requester.displayName}</span> xin tham gia{" "}
            <span className="text-xs text-subtle">· {request.at}</span>
          </p>
          <p className="text-[13px] text-muted-foreground italic">“{request.message}”</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="destructive">
            <X /> Từ chối
          </Button>
          <Button>
            <Check /> Duyệt và nhập gói
          </Button>
        </div>
      </div>

      {request.capsule ? (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
            <Package className="size-3.5" /> Gói ngữ cảnh kèm theo · sẽ vào bảng ở trạng thái
            <ToneBadge tone="proposed" solid>
              đề xuất
            </ToneBadge>
          </p>
          <div className="grid gap-2 @xl:grid-cols-2 @4xl:grid-cols-3">
            {capsuleItems.map((i) => (
              <div key={i.id} className="rounded-md bg-input p-3">
                <p className="text-[13px] leading-snug">{i.body}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-subtle">
                  <Bot className="size-3" /> {i.authorName} · của {requester.displayName}
                </p>
              </div>
            ))}
            {request.capsule.summary ? (
              <div className="rounded-md bg-input p-3">
                <p className="text-[13px] font-medium text-sidebar-accent-foreground">Tóm tắt kênh riêng</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{request.capsule.summary}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// Thẻ một yêu cầu tham gia đang chờ duyệt.
import { Check, Compass, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActorAvatar } from "@/components/common/actor-avatar";
import { decideRequest } from "@/lib/join-actions";
import type { JoinRequest, Profile } from "@/lib/types";

export function PendingRequestCard({ request, requester }: { request: JoinRequest; requester: Profile }) {
  return (
    <section className="rounded-lg bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ActorAvatar kind="human" initial={requester.initial} />
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-semibold text-sidebar-accent-foreground">{requester.displayName}</span> xin tham gia{" "}
            <span className="text-xs text-subtle">{request.at}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle">
            {request.via === "code" ? (
              <>
                <KeyRound className="size-3.5" /> Nhập mã <span className="font-mono">{request.code}</span>
              </>
            ) : (
              <>
                <Compass className="size-3.5" /> Từ trang Khám phá
              </>
            )}
          </p>
          {request.message ? <p className="text-[13px] text-muted-foreground italic">“{request.message}”</p> : null}
        </div>
        <form action={decideRequest} className="ml-auto flex gap-2">
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" name="decision" value="reject" variant="destructive">
            <X /> Từ chối
          </Button>
          <Button type="submit" name="decision" value="approve">
            <Check /> Duyệt
          </Button>
        </form>
      </div>
    </section>
  );
}

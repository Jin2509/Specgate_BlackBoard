// Shows one pending join request with its approve and decline buttons.
import { Check, Compass, KeyRound, X } from "lucide-react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import type { JoinRequest } from "@/types/join";
import { toDayClock } from "@/utils/date-format";

import { updateJoinRequest } from "../api/request-actions";

export function PendingRequestCard({ joinRequest }: { joinRequest: JoinRequest }) {
  const requester = joinRequest.user;
  return (
    <section className="rounded-lg bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ActorAvatar kind="human" initial={requester?.initial} />
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-semibold text-sidebar-accent-foreground">{requester?.displayName ?? joinRequest.userId}</span>{" "}
            {t.requests.asksToJoin} <span className="text-xs text-subtle">{toDayClock(joinRequest.at)}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle">
            {joinRequest.via === "code" ? (
              <>
                <KeyRound className="size-3.5" /> {t.requests.viaCode} <span className="font-mono">{joinRequest.code}</span>
              </>
            ) : (
              <>
                <Compass className="size-3.5" /> {t.requests.viaExplore}
              </>
            )}
          </p>
          {joinRequest.message ? (
            <p className="text-[0.8125rem] text-muted-foreground italic">&ldquo;{joinRequest.message}&rdquo;</p>
          ) : null}
        </div>
        <form action={updateJoinRequest} className="ml-auto flex gap-2">
          <input type="hidden" name="requestId" value={joinRequest.id} />
          <Button type="submit" name="decision" value="reject" variant="destructive">
            <X /> {t.requests.reject}
          </Button>
          <Button type="submit" name="decision" value="approve">
            <Check /> {t.requests.approve}
          </Button>
        </form>
      </div>
    </section>
  );
}

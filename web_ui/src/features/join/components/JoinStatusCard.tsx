// Shows the state of a join request: pending (refreshing itself), declined or cancelled.
import { Clock, KeyRound, Users, XCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AutoRefresh } from "@/components/AutoRefresh";
import { Button } from "@/components/ui/Button";
import { format, t } from "@/lib/i18n";
import type { JoinRequest, WorkspaceCard } from "@/types/join";
import { toDayClock } from "@/utils/date-format";
import { toPersonalHomePath } from "@/utils/route-paths";

import { cancelJoinRequest } from "../api/join-actions";

function toTitle(status: JoinRequest["status"]): string {
  if (status === "pending") return t.join.statusPendingTitle;
  return status === "rejected" ? t.join.statusRejectedTitle : t.join.statusCancelledTitle;
}

function toBody(status: JoinRequest["status"], workspace: WorkspaceCard): string {
  const values = { workspace: workspace.name, owner: workspace.ownerName };
  if (status === "pending") return format(t.join.statusPendingBody, values);
  return format(status === "rejected" ? t.join.statusRejectedBody : t.join.statusCancelledBody, values);
}

export function JoinStatusCard({
  joinRequest,
  workspace,
  personalWorkspaceId,
}: {
  joinRequest: JoinRequest;
  workspace: WorkspaceCard;
  personalWorkspaceId: string | null;
}) {
  const isPending = joinRequest.status === "pending";

  return (
    <div className="flex flex-col items-center text-center">
      {isPending ? <AutoRefresh /> : null}
      <span className="relative flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground">
        {workspace.short}
        <span className="absolute -right-1.5 -bottom-1.5 flex size-8 items-center justify-center rounded-full border-4 border-canvas bg-card">
          {isPending ? <Clock className="size-4 text-proposed" /> : <XCircle className="size-4 text-rejected" />}
        </span>
      </span>

      <h1 className="mt-5 text-2xl font-semibold text-sidebar-accent-foreground">{toTitle(joinRequest.status)}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">{toBody(joinRequest.status, workspace)}</p>

      <dl className="mt-5 grid w-full gap-2 rounded-md bg-card p-3 text-left text-sm">
        <StatusRow label={t.join.rowBrief}>{workspace.brief}</StatusRow>
        <StatusRow label={t.join.rowVia}>
          {joinRequest.via === "code" ? (
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="size-3.5" /> {format(t.join.viaCode, { code: joinRequest.code ?? "" })}
            </span>
          ) : (
            t.join.viaExplore
          )}
        </StatusRow>
        <StatusRow label={t.join.rowAt}>{toDayClock(joinRequest.at)}</StatusRow>
        <StatusRow label={t.join.rowTeam}>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {format(t.join.memberCount, { count: workspace.memberCount })}
          </span>
        </StatusRow>
      </dl>

      {isPending ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-subtle">
          <span className="size-2 animate-pulse rounded-full bg-proposed" /> {t.join.pollingNote}
        </p>
      ) : null}

      <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
        <Button asChild className="h-11 text-base">
          <Link href={toPersonalHomePath(personalWorkspaceId)}>{t.join.backToPersonal}</Link>
        </Button>
        {isPending ? (
          <form action={cancelJoinRequest}>
            <input type="hidden" name="requestId" value={joinRequest.id} />
            <Button type="submit" variant="secondary" className="h-11 w-full text-base">
              {t.join.cancelRequest}
            </Button>
          </form>
        ) : (
          <Button asChild variant="secondary" className="h-11 text-base">
            <Link href={`/w/${personalWorkspaceId}/explore`}>{t.join.findOther}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-2">
      <dt className="text-[13px] font-semibold text-subtle">{label}</dt>
      <dd className="leading-snug text-foreground">{children}</dd>
    </div>
  );
}

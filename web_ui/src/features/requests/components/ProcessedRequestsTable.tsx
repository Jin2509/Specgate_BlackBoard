// Lists the join requests already approved, declined or cancelled.
import { History } from "lucide-react";

import { Panel } from "@/components/Panel";
import { ToneBadge } from "@/components/ToneBadge";
import { format, t } from "@/lib/i18n";
import type { JoinRequest } from "@/types/join";
import { toDayClock } from "@/utils/date-format";

export function ProcessedRequestsTable({ joinRequests }: { joinRequests: JoinRequest[] }) {
  return (
    <Panel title={t.requests.processed} icon={<History />}>
      {joinRequests.length === 0 ? <p className="py-2 text-[13px] text-subtle">{t.requests.noProcessed}</p> : null}
      <table hidden={joinRequests.length === 0} className="w-full text-[13px]">
        <thead>
          <tr className="border-b text-left text-xs text-subtle">
            <th className="py-2 font-normal">{t.requests.columnRequester}</th>
            <th className="py-2 font-normal">{t.requests.columnVia}</th>
            <th className="py-2 font-normal">{t.requests.columnMessage}</th>
            <th className="py-2 font-normal">{t.requests.columnOutcome}</th>
            <th className="py-2 font-normal">{t.requests.columnBy}</th>
          </tr>
        </thead>
        <tbody>
          {joinRequests.map((joinRequest) => (
            <tr key={joinRequest.id} className="border-b last:border-0">
              <td className="py-2.5 font-medium">{joinRequest.user?.displayName ?? joinRequest.userId}</td>
              <td className="py-2.5 text-muted-foreground">
                {joinRequest.via === "code"
                  ? format(t.requests.viaCodeShort, { code: joinRequest.code ?? "" })
                  : t.requests.viaExploreShort}
              </td>
              <td className="py-2.5 text-muted-foreground">{joinRequest.message || t.requests.noMessage}</td>
              <td className="py-2.5">
                <StatusBadge status={joinRequest.status} />
              </td>
              <td className="py-2.5 text-muted-foreground">
                {joinRequest.deciderName ?? joinRequest.user?.displayName} · {toDayClock(joinRequest.decidedAt ?? joinRequest.at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function StatusBadge({ status }: { status: JoinRequest["status"] }) {
  if (status === "approved") {
    return (
      <ToneBadge tone="decided" isSolid>
        {t.requests.approved}
      </ToneBadge>
    );
  }
  if (status === "cancelled") {
    return (
      <ToneBadge tone="neutral" isSolid>
        {t.requests.cancelled}
      </ToneBadge>
    );
  }
  return (
    <ToneBadge tone="rejected" isSolid>
      {t.requests.rejected}
    </ToneBadge>
  );
}

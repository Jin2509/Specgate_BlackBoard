// Bảng lịch sử yêu cầu tham gia đã xử lý.
import { History } from "lucide-react";
import { Panel } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import type { JoinRequest } from "@/lib/types";

export interface ProcessedRequestRow {
  request: JoinRequest;
  requesterName?: string;
  deciderName?: string;
}

export function ProcessedRequestsTable({ rows }: { rows: ProcessedRequestRow[] }) {
  return (
    <Panel title="Đã xử lý" icon={<History />}>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b text-left text-xs text-subtle">
            <th className="py-2 font-normal">Người xin</th>
            <th className="py-2 font-normal">Lời nhắn</th>
            <th className="py-2 font-normal">Gói</th>
            <th className="py-2 font-normal">Kết quả</th>
            <th className="py-2 font-normal">Bởi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ request: r, requesterName, deciderName }) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2.5 font-medium">{requesterName}</td>
              <td className="py-2.5 text-muted-foreground">{r.message || "(không có)"}</td>
              <td className="tabular py-2.5">{r.capsule ? `${r.capsule.itemIds.length} ý` : "–"}</td>
              <td className="py-2.5">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-2.5 text-muted-foreground">
                {deciderName} · {r.at}
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
      <ToneBadge tone="decided" solid>
        Đã duyệt
      </ToneBadge>
    );
  }
  if (status === "cancelled") {
    return (
      <ToneBadge tone="neutral" solid>
        Đã hủy
      </ToneBadge>
    );
  }
  return (
    <ToneBadge tone="rejected" solid>
      Từ chối
    </ToneBadge>
  );
}

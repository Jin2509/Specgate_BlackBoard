// Danh sách liên kết mời đang hoạt động của workspace chung.
import { Link2 } from "lucide-react";
import { Panel } from "@/components/common/panel";
import type { Invite } from "@/lib/types";

export function InviteList({ invites, creatorName }: { invites: Invite[]; creatorName: (id: string) => string | undefined }) {
  return (
    <Panel title="Lời mời" icon={<Link2 />}>
      {invites.length === 0 ? (
        <p className="text-[13px] text-subtle">Chưa có liên kết mời. Tạo từ menu tên workspace → Mời mọi người.</p>
      ) : (
        <ul className="space-y-1">
          {invites.map((i) => (
            <li key={i.code} className="rounded-md bg-input px-3 py-2">
              <p className="font-mono text-[13px] text-sidebar-accent-foreground">/invite/{i.code}</p>
              <p className="mt-0.5 text-xs text-subtle">
                {creatorName(i.createdBy)} tạo · {i.uses} lượt dùng · hết hạn {i.expiresAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

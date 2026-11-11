// Danh sách thành viên và vai trò trong workspace.
import { Users } from "lucide-react";
import { ActorAvatar } from "@/components/common/actor-avatar";
import { Panel } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import type { MemberRole, Profile } from "@/lib/types";

export interface MemberRow {
  profile: Profile | undefined;
  role: MemberRole;
}

export function MemberList({ members }: { members: MemberRow[] }) {
  return (
    <Panel title="Thành viên" icon={<Users />}>
      <ul className="divide-y">
        {members.map(({ profile, role }, i) => (
          <li key={profile?.id ?? i} className="flex items-center gap-2.5 py-2">
            <ActorAvatar kind="human" initial={profile?.initial} size="sm" />
            <span className="text-[13px]">{profile?.displayName}</span>
            <ToneBadge tone={role === "owner" ? "proposed" : "neutral"} className="ml-auto">
              {role === "owner" ? "Chủ" : "Thành viên"}
            </ToneBadge>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

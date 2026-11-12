// Đội của workspace chung: quyền (chủ/thành viên), vai trong nhóm do từng người tự mô tả, và agent riêng của mỗi người.
// Không hiện key của ai: mỗi agent chạy bằng key của chính chủ nó, chi phí tính vào key đó.
import { Users } from "lucide-react";
import { ActorAvatar } from "@/components/common/actor-avatar";
import { ToneBadge } from "@/components/common/tone-badge";
import type { TeamMember } from "@/lib/mock/queries";

const PROVIDER_LABEL = { anthropic: "Anthropic", "openai-compatible": "Kiểu OpenAI" } as const;

export function MemberList({ team, viewerId }: { team: TeamMember[]; viewerId: string }) {
  return (
    <section className="min-w-0 overflow-x-auto rounded-lg bg-card">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <Users className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Đội và agent</h2>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b text-left text-xs text-subtle">
            <th className="px-4 py-2 font-normal">Người</th>
            <th className="py-2 font-normal">Quyền</th>
            <th className="py-2 font-normal">Vai trong nhóm</th>
            <th className="py-2 pr-4 font-normal">Agent riêng</th>
          </tr>
        </thead>
        <tbody>
          {team.map((m) => (
            <tr key={m.profile.id} className="border-b last:border-0">
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-2">
                  <ActorAvatar kind="human" initial={m.profile.initial} size="xs" />
                  {m.profile.displayName}
                  {m.profile.id === viewerId ? <span className="text-subtle">(bạn)</span> : null}
                </span>
              </td>
              <td className="py-2.5">
                <ToneBadge tone={m.role === "owner" ? "proposed" : "neutral"}>
                  {m.role === "owner" ? "Chủ" : "Thành viên"}
                </ToneBadge>
              </td>
              <td className="py-2.5 text-muted-foreground">{m.teamRole ?? <span className="text-subtle">chưa ghi</span>}</td>
              <td className="py-2.5 pr-4">
                {m.agent ? (
                  <span className="flex flex-col leading-tight">
                    <span className="font-mono text-xs text-agent">{m.agent.model}</span>
                    <span className="text-[11px] text-subtle">{PROVIDER_LABEL[m.agent.provider]}</span>
                  </span>
                ) : (
                  <span className="text-subtle">chưa nhập key</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-4 py-2.5 text-xs leading-relaxed text-subtle">
        Mỗi người tự ghi vai của mình ở khung &quot;Agent đang đọc&quot; trong hội thoại riêng. Agent chạy bằng key của chính
        người đó; không ai thấy key của người khác.
      </p>
    </section>
  );
}

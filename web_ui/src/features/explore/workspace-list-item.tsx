// Thẻ một workspace chung trên trang khám phá, kèm trạng thái tham gia.
import { Bot, FlaskConical, Users } from "lucide-react";
import { ToneBadge } from "@/components/common/tone-badge";
import type { JoinRelation, Workspace } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WorkspaceListItem({
  ws,
  relation,
  selected,
  onSelect,
}: {
  ws: Workspace;
  relation: JoinRelation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg bg-card text-left transition-colors hover:bg-accent",
        selected && "ring-2 ring-primary",
      )}
    >
      <span className="h-14 w-full bg-input" />
      <span className="-mt-7 px-4">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl border-4 border-card bg-primary text-sm font-bold text-primary-foreground">
          {ws.short}
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1 px-4 pt-2 pb-4">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-sidebar-accent-foreground">{ws.name}</span>
          <RelationBadge relation={relation} />
        </span>
        <span className="line-clamp-2 text-[13px] leading-snug text-subtle">{ws.brief}</span>
        <span className="mt-auto flex items-center gap-3 pt-2 text-xs text-subtle">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {ws.members.length} thành viên
          </span>
          <span className="inline-flex items-center gap-1">
            <Bot className="size-3.5" /> {ws.agentIds.length} agent
          </span>
          {ws.modules.includes("adom") ? (
            <span className="inline-flex items-center gap-1 text-data">
              <FlaskConical className="size-3.5" /> ADOM
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function RelationBadge({ relation }: { relation: JoinRelation }) {
  if (relation === "pending") return <ToneBadge tone="proposed">Đang chờ duyệt</ToneBadge>;
  if (relation === "member") return <ToneBadge tone="decided">Đã tham gia</ToneBadge>;
  return null;
}

// Renders one shared workspace on the Explore page with the viewer's join state.
import { Users } from "lucide-react";

import { ToneBadge } from "@/components/ToneBadge";
import { format, t } from "@/lib/i18n";
import type { ExploreCard, JoinRelation } from "@/types/join";
import { cn } from "@/utils/cn";

export function WorkspaceCardButton({
  workspace,
  isSelected,
  onSelect,
}: {
  workspace: ExploreCard;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg bg-card text-left transition-colors hover:bg-accent",
        isSelected && "ring-2 ring-primary",
      )}
    >
      <span className="h-14 w-full bg-input" />
      <span className="-mt-7 px-4">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl border-4 border-card bg-primary text-sm font-bold text-primary-foreground">
          {workspace.short}
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1 px-4 pt-2 pb-4">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-sidebar-accent-foreground">{workspace.name}</span>
          <RelationBadge relation={workspace.relation} />
        </span>
        <span className="line-clamp-2 text-[13px] leading-snug text-subtle">{workspace.brief}</span>
        <span className="mt-auto flex items-center gap-3 pt-2 text-xs text-subtle">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {format(t.join.memberCount, { count: workspace.memberCount })}
          </span>
          <span>{format(t.join.ownerShort, { name: workspace.ownerName })}</span>
        </span>
      </span>
    </button>
  );
}

function RelationBadge({ relation }: { relation: JoinRelation }) {
  if (relation === "pending") return <ToneBadge tone="proposed">{t.join.relationPending}</ToneBadge>;
  if (relation === "member") return <ToneBadge tone="decided">{t.join.relationMember}</ToneBadge>;
  return null;
}

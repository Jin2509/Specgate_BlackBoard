// Lists the team: name and colour in the workspace, role, self-described team role and personal agent; never a key.
import { ActorAvatar } from "@/components/ActorAvatar";
import { ToneBadge } from "@/components/ToneBadge";
import { format, t } from "@/lib/i18n";
import type { TeamMember } from "@/types/workspace";

import { MemberActionsMenu } from "./MemberActionsMenu";

const PROVIDER_LABELS = { anthropic: t.settings.providerAnthropic, "openai-compatible": t.settings.providerOpenAi } as const;

export function MemberList({
  team,
  viewerId,
  workspaceId,
  isViewerOwner,
}: {
  team: TeamMember[];
  viewerId: string;
  workspaceId: string;
  isViewerOwner: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <ul className="divide-y divide-border">
        {team.map((member) => {
          const isSelf = member.user.id === viewerId;
          const isOwnerRow = member.role === "owner";
          const canRemove = isViewerOwner && !isOwnerRow && !isSelf;
          const canLeave = isSelf && !isOwnerRow;
          const hasActions = isSelf || canRemove;
          const accountLine = [
            member.user.accountName && member.user.accountName !== member.user.displayName
              ? format(t.settings.accountName, { name: member.user.accountName })
              : null,
            member.user.account,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={member.user.id} className="flex items-center gap-3 px-4 py-3">
              <ActorAvatar kind="human" initial={member.user.initial} colorIndex={member.user.color} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <span className="truncate font-medium text-foreground">{member.user.displayName}</span>
                  {isSelf ? <span className="text-xs text-subtle">({t.common.you})</span> : null}
                  <ToneBadge tone={isOwnerRow ? "proposed" : "neutral"}>
                    {isOwnerRow ? t.settings.owner : t.settings.member}
                  </ToneBadge>
                </p>
                <p className="truncate text-xs text-subtle">
                  {member.teamRole ?? t.settings.notWritten}
                  {accountLine ? ` · ${accountLine}` : ""}
                </p>
              </div>
              <div className="hidden min-w-0 text-right @xl:block">
                {member.agent ? (
                  <>
                    <p className="truncate text-xs font-medium text-agent">{member.agent.label}</p>
                    <p className="truncate font-mono text-[11px] text-subtle">
                      {member.agent.model} · {PROVIDER_LABELS[member.agent.provider]}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-subtle">{t.settings.noKey}</p>
                )}
              </div>
              <div className="w-8 shrink-0">
                {hasActions ? (
                  <MemberActionsMenu
                    workspaceId={workspaceId}
                    userId={member.user.id}
                    memberName={member.user.displayName}
                    isSelf={isSelf}
                    canLeave={canLeave}
                    canRemove={canRemove}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

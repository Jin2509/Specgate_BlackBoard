// Shows exactly what the agent receives about the linked team with each question, and where the user can change it.
import { ClipboardList, Highlighter, History, KanbanSquare, MessageSquareText, Users } from "lucide-react";
import Link from "next/link";

import { ActorAvatar } from "@/components/ActorAvatar";
import { format, t } from "@/lib/i18n";
import type { AgentContext } from "@/types/highlight";
import { toDayClock } from "@/utils/date-format";

import { ContextSection } from "./ContextSection";
import { ContextTimeline } from "./ContextTimeline";
import { DigestButton } from "./DigestButton";
import { SaveDigestButton } from "./SaveDigestButton";
import { TeamRoleForm } from "./TeamRoleForm";

export function AgentContextPanel({
  context,
  userId,
  home,
  conversationId,
}: {
  context: AgentContext;
  userId: string;
  home: string;
  conversationId: string;
}) {
  const workspace = context.workspace;

  return (
    <aside className="flex w-full flex-col border-l border-sidebar-border bg-sidebar">
      <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-4">
        <h2 className="truncate text-[13px] font-semibold text-sidebar-accent-foreground">
          {format(t.personal.contextHeading, { name: workspace.name })}
        </h2>
      </div>
      <div className="flex-1 scrollbar-thin space-y-5 overflow-y-auto p-4 text-[13px]">
        <ContextSection icon={<Users />} title={t.personal.myTeamRole}>
          <TeamRoleForm workspaceId={workspace.id} teamRole={context.myTeamRole} />
          <p className="mt-1 text-xs text-subtle">{t.personal.teamRoleHint}</p>
        </ContextSection>

        <ContextSection icon={<Users />} title={format(t.personal.members, { count: context.team.length })}>
          <ul className="space-y-2">
            {context.team.map((member) => (
              <li key={member.user.id} className="flex items-start gap-2">
                <ActorAvatar
                  kind="human"
                  initial={member.user.initial}
                  colorIndex={member.user.color}
                  size="xs"
                  className="mt-0.5"
                />
                <div className="min-w-0 leading-snug">
                  <p className="text-foreground">
                    {member.user.displayName}
                    {member.role === "owner" ? <span className="text-subtle">{t.personal.ownerTag}</span> : null}
                    {member.user.id === userId ? <span className="text-subtle">{t.personal.youTag}</span> : null}
                    {member.teamRole ? <span className="text-muted-foreground">: {member.teamRole}</span> : null}
                  </p>
                  <p className="truncate text-[11.5px] text-agent">
                    {member.agent ? (
                      <>
                        {member.agent.name} <span className="font-mono text-subtle">{member.agent.model}</span>
                      </>
                    ) : (
                      <span className="text-subtle">{t.personal.noKey}</span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </ContextSection>

        <ContextSection icon={<ClipboardList />} title={t.personal.tasks}>
          {context.tasks.length > 0 ? (
            <ul className="space-y-1">
              {context.tasks.map((task) => (
                <li key={task.number} className="leading-snug text-foreground">
                  <span className="font-mono text-[11.5px] text-subtle">{format(t.tasks.number, { number: task.number })}</span>{" "}
                  {task.body}{" "}
                  <span className={task.assigneeName ? "text-muted-foreground" : "text-proposed"}>
                    ({task.assigneeName ?? t.tasks.unassigned})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{t.personal.tasksEmpty}</p>
          )}
          <p className="mt-1 text-xs text-subtle">{t.personal.tasksHint}</p>
        </ContextSection>

        <ContextSection icon={<KanbanSquare />} title={t.personal.board}>
          <p className="text-muted-foreground">
            {format(t.personal.boardSummary, { decided: context.decided.length, rejected: context.rejected.length })}
          </p>
        </ContextSection>

        {context.digest || context.digestPending ? (
          <ContextSection icon={<History />} title={t.personal.oldMessages}>
            {context.digestPending ? (
              <p className="font-medium text-proposed">
                {format(t.personal.omittedMessages, { count: context.ownMessagesOmitted })}
              </p>
            ) : null}
            {context.digestPending && context.digestPlan ? (
              <DigestButton conversationId={conversationId} plan={context.digestPlan} />
            ) : null}
            {context.digest ? (
              <div className={context.digestPending ? "mt-3" : undefined}>
                <p className="text-xs text-subtle">
                  {format(t.personal.digestDone, {
                    count: context.digest.count,
                    time: toDayClock(context.digest.at),
                    blocks: context.digest.blocks,
                  })}
                </p>
                <SaveDigestButton workspaceId={workspace.id} home={home} />
              </div>
            ) : null}
          </ContextSection>
        ) : null}

        <ContextSection
          icon={<MessageSquareText />}
          title={format(t.personal.timeline, {
            own: context.ownMessagesCount,
            highlights: context.highlights.length,
            limit: context.highlightLimit,
          })}
        >
          <p className="text-xs text-subtle">{t.personal.timelineHint}</p>
          <ContextTimeline context={context} />
        </ContextSection>

        <ContextSection icon={<Highlighter />} title={t.personal.manageHighlights}>
          <Link href={`${home}/agent-highlights`} className="text-primary-strong underline-offset-2 hover:underline">
            {t.personal.openAgentHighlights}
          </Link>
        </ContextSection>

        <p className="border-t border-sidebar-border pt-3 text-xs leading-relaxed text-subtle">{t.personal.privacyFooter}</p>
      </div>
    </aside>
  );
}

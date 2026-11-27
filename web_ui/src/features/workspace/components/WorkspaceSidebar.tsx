"use client";
// Renders the channel column of a shared workspace: menu, brief, channels, boards, management and agents.
import { ClipboardList, FileText, Hash, KanbanSquare, Plus, Settings, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { NavGroup } from "@/components/NavGroup";
import { NavItem } from "@/components/NavItem";
import { format, t } from "@/lib/i18n";
import type { PersonalAgent } from "@/types/agent";
import type { JoinCode } from "@/types/join";
import type { SharedWorkspace } from "@/types/workspace";

import { CreateChannelDialog } from "./CreateChannelDialog";
import { WorkspaceMenu } from "./WorkspaceMenu";
import { useWorkspaceBadges } from "../hooks/use-workspace-badges";
import { toChannelDot } from "../utils/channel-dot";

export interface SidebarCounts {
  ideas: number;
  openTasks: number;
  pendingRequests: number;
}

export function WorkspaceSidebar({
  workspace,
  agents,
  counts,
  isViewerOwner,
  joinCode,
  explorePath,
  footer,
}: {
  workspace: SharedWorkspace;
  agents: Array<PersonalAgent & { color?: number }>;
  counts: SidebarCounts;
  isViewerOwner: boolean;
  joinCode: JoinCode | null;
  explorePath: string;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const basePath = `/w/${workspace.id}`;
  const isAt = (path: string) => pathname === `${basePath}${path}`;
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const liveChannels = useWorkspaceBadges()?.get(workspace.id)?.channels;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <WorkspaceMenu
        workspace={workspace}
        joinCode={joinCode}
        isOwner={isViewerOwner}
        pendingRequestCount={counts.pendingRequests}
        explorePath={explorePath}
      />

      <div className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-3">
        <div className="px-2 pt-4">
          <p className="text-[0.8125rem] font-semibold text-subtle">{t.workspace.brief}</p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">{workspace.brief}</p>
        </div>

        <NavGroup label={t.workspace.channels}>
          {workspace.channels.map((channel) => {
            const isActive = isAt(`/c/${channel.name}`) || isAt(`/c/${channel.id}`);
            const dot = toChannelDot(channel, liveChannels, isActive);
            return (
              <NavItem
                key={channel.id}
                href={`${basePath}/c/${channel.name}`}
                isActive={isActive}
                icon={<Hash />}
                dot={dot}
                dotLabel={dot === "mention" ? t.workspace.mentionDot : t.workspace.unreadDot}
              >
                {channel.name}
              </NavItem>
            );
          })}
          {isViewerOwner ? (
            <button
              type="button"
              onClick={() => setIsNewChannelOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-md px-2 text-left text-[0.875rem] text-subtle transition-colors hover:bg-hover hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Plus className="size-4" /> {t.workspace.createChannel}
            </button>
          ) : null}
        </NavGroup>

        <NavGroup label={t.workspace.blackboard}>
          <NavItem href={`${basePath}/board`} isActive={isAt("/board")} icon={<KanbanSquare />} count={counts.ideas}>
            {t.workspace.board}
          </NavItem>
          <NavItem href={`${basePath}/tasks`} isActive={isAt("/tasks")} icon={<ClipboardList />} count={counts.openTasks}>
            {t.workspace.taskBoard}
          </NavItem>
          <NavItem href={`${basePath}/brief`} isActive={isAt("/brief")} icon={<FileText />}>
            {t.workspace.briefPage}
          </NavItem>
        </NavGroup>

        <NavGroup label={t.workspace.management}>
          <NavItem href={`${basePath}/settings`} isActive={isAt("/settings")} icon={<Settings />}>
            {t.workspace.membersAndAgents}
          </NavItem>
          {isViewerOwner ? (
            <NavItem
              href={`${basePath}/requests`}
              isActive={isAt("/requests")}
              icon={<UserPlus />}
              count={counts.pendingRequests}
              isCountUrgent
            >
              {t.workspace.joinRequests}
            </NavItem>
          ) : null}
        </NavGroup>

        <NavGroup label={format(t.workspace.memberAgents, { count: agents.length })}>
          {agents.map((agent) => (
            <div key={agent.ownerId} className="flex h-10 items-center gap-2.5 rounded px-2 hover:bg-hover">
              <ActorAvatar kind="agent" initial={agent.name} colorIndex={agent.color} size="sm" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[0.8125rem] font-medium text-muted-foreground">{agent.label}</p>
                <p className="truncate font-mono text-[0.6875rem] text-subtle">{agent.model}</p>
              </div>
            </div>
          ))}
          {agents.length === 0 ? <p className="px-2 text-xs text-subtle">{t.workspace.noAgents}</p> : null}
        </NavGroup>
      </div>

      {footer}
      <CreateChannelDialog workspaceId={workspace.id} isOpen={isNewChannelOpen} onOpenChange={setIsNewChannelOpen} />
    </aside>
  );
}

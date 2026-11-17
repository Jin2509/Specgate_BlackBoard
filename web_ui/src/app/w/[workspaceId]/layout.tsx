// Lays out a workspace: checks membership, then renders the workspace rail, the channel column and the content area.
import { Suspense, type ReactNode } from "react";

import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";
import { requireMe } from "@/features/auth/server";
import { toIdeaCount } from "@/features/board";
import { getBoard } from "@/features/board/server";
import { listHighlights } from "@/features/highlight/server";
import { PersonalSidebar } from "@/features/personal";
import { listConversations } from "@/features/personal/server";
import { listJoinRequests } from "@/features/requests/server";
import { listRuns } from "@/features/runs/server";
import { isOwner, NicknamePrompt, ShellSkeleton, UserPanel, WorkspaceRail, WorkspaceSidebar } from "@/features/workspace";
import { requireWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";
import type { Me } from "@/types/account";
import type { SharedWorkspace } from "@/types/workspace";
import { toDayClock } from "@/utils/date-format";
import { toPersonalHomePath, toWorkspaceHomePath } from "@/utils/route-paths";

export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspaceId]">) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Suspense fallback={<ShellSkeleton />}>
        <WorkspaceShell params={params}>{children}</WorkspaceShell>
      </Suspense>
    </div>
  );
}

async function WorkspaceShell({ params, children }: { params: Promise<{ workspaceId: string }>; children: ReactNode }) {
  const workspace = await requireWorkspace(params);
  const me = await requireMe(toWorkspaceHomePath(workspace));
  const personalWorkspaceId = me.personalWorkspaceId ?? workspace.id;

  return (
    <>
      <CollapsibleSidebar id="workspace-nav" side="left" breakpoint="md" label={t.workspace.sidebarLabel} widthClassName="w-80">
        <WorkspaceRail
          workspaces={me.workspaces}
          pendingJoins={me.pendingJoins}
          activeId={workspace.id}
          personalId={personalWorkspaceId}
        />
        {workspace.kind === "personal" ? (
          <PersonalShellSidebar home={toPersonalHomePath(workspace.id)} me={me} />
        ) : (
          <SharedShellSidebar
            workspace={workspace as SharedWorkspace}
            explorePath={`/w/${personalWorkspaceId}/explore`}
            me={me}
          />
        )}
      </CollapsibleSidebar>
      <div className="flex min-w-0 flex-1">{children}</div>
    </>
  );
}

async function PersonalShellSidebar({ home, me }: { home: string; me: Me }) {
  const [conversations, highlights] = await Promise.all([listConversations(), listHighlights()]);
  return (
    <PersonalSidebar
      home={home}
      providerKey={me.key}
      conversations={conversations}
      privateHighlightCount={me.privateHighlights.total}
      agentHighlightCount={highlights.total}
      footer={<UserPanel user={me.user} settingsHref={`${home}/key`} settingsLabel={t.workspace.keyAndModel} />}
    />
  );
}

async function SharedShellSidebar({ workspace, explorePath, me }: { workspace: SharedWorkspace; explorePath: string; me: Me }) {
  const isViewerOwner = isOwner(workspace);
  const hasRuns = workspace.modules?.includes("adom") ?? false;
  const [board, joinRequests, runs] = await Promise.all([
    getBoard(workspace.id),
    isViewerOwner ? listJoinRequests(workspace.id) : null,
    hasRuns ? listRuns(workspace.id) : null,
  ]);
  return (
    <>
      {workspace.needsNickname ? (
        <NicknamePrompt workspaceId={workspace.id} workspaceName={workspace.name} currentName={workspace.myName ?? ""} />
      ) : null}
      <WorkspaceSidebar
        workspace={workspace}
        agents={workspace.members.flatMap((member) => (member.agent ? [{ ...member.agent, color: member.user.color }] : []))}
        isViewerOwner={isViewerOwner}
        joinCode={workspace.joinCode ? { code: workspace.joinCode, createdAt: toDayClock(workspace.joinCodeAt) } : null}
        explorePath={explorePath}
        counts={{
          ideas: toIdeaCount(board),
          runs: runs?.runs.length ?? 0,
          pendingRequests: joinRequests?.pending.length ?? 0,
        }}
        footer={
          <UserPanel
            user={{ ...me.user, displayName: workspace.myName ?? me.user.displayName }}
            settingsHref={`/w/${workspace.id}/settings`}
            settingsLabel={t.workspace.membersAndAgents}
          />
        }
      />
    </>
  );
}

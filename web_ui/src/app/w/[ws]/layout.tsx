// Layout workspace: kiểm tra đăng nhập và quyền thành viên, rồi dựng thanh workspace, cột kênh và vùng nội dung.
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { CollapsibleSidebar } from "@/components/common/collapsible-sidebar";
import { PersonalSidebar } from "@/features/personal/personal-sidebar";
import { ShellSkeleton } from "@/features/workspace-shell/shell-skeleton";
import { UserPanel } from "@/features/workspace-shell/user-panel";
import { WorkspaceRail } from "@/features/workspace-shell/workspace-rail";
import { WorkspaceSidebar } from "@/features/workspace-shell/workspace-sidebar";
import {
  countIdeas,
  getConversations,
  getHighlights,
  getJoinCode,
  getPendingJoins,
  getPersonalWorkspace,
  getProviderKey,
  getRail,
  getRuns,
  getTeamAgents,
  isMember,
  isOwner,
  pendingRequests,
} from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { personalHome, workspaceHome } from "@/lib/paths";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;

export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[ws]">) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Suspense fallback={<ShellSkeleton />}>
        <WorkspaceShell params={params}>{children}</WorkspaceShell>
      </Suspense>
    </div>
  );
}

async function WorkspaceShell({ params, children }: { params: Promise<{ ws: string }>; children: ReactNode }) {
  const ws = await requireWorkspace(params);
  const { user } = await requireSession(workspaceHome(ws));
  const personal = getPersonalWorkspace(user.id);
  const explorePath = `/w/${personal?.id}/explore`;
  if (!isMember(ws, user.id)) redirect(`${explorePath}?ws=${ws.id}`);
  const pendingJoins = getPendingJoins(user.id).map(({ request, ws: w }) => ({ requestId: request.id, ws: w }));

  return (
    <>
      <CollapsibleSidebar side="left" breakpoint="md" label="cột workspace và kênh" widthClassName="w-80">
        <WorkspaceRail items={getRail(user.id)} pending={pendingJoins} activeId={ws.id} personalId={personal?.id ?? ws.id} />
        {ws.kind === "personal" ? (
          <PersonalSidebar
            home={personalHome(ws.id)}
            providerKey={getProviderKey(user.id)}
            conversations={getConversations(user.id)}
            highlightCount={getHighlights(user.id).length}
            footer={<UserPanel user={user} settingsHref={`${personalHome(ws.id)}/key`} settingsLabel="Key và mô hình" />}
          />
        ) : (
          <WorkspaceSidebar
            ws={ws}
            agents={getTeamAgents(ws)}
            viewerIsOwner={isOwner(ws, user.id)}
            joinCode={getJoinCode(ws.id)}
            explorePath={explorePath}
            counts={{
              ideas: countIdeas(ws.id),
              runs: getRuns(ws.id).length,
              pendingRequests: pendingRequests(ws.id).length,
            }}
            footer={<UserPanel user={user} settingsHref={`/w/${ws.id}/settings`} settingsLabel="Thành viên và agent" />}
          />
        )}
      </CollapsibleSidebar>
      <div className="flex min-w-0 flex-1">{children}</div>
    </>
  );
}

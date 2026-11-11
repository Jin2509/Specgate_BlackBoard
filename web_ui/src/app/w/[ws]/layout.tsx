// Layout workspace: kiểm tra đăng nhập và quyền thành viên, rồi dựng thanh workspace, cột kênh và vùng nội dung.
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ShellSkeleton } from "@/features/workspace-shell/shell-skeleton";
import { UserPanel } from "@/features/workspace-shell/user-panel";
import { WorkspaceRail } from "@/features/workspace-shell/workspace-rail";
import { WorkspaceSidebar } from "@/features/workspace-shell/workspace-sidebar";
import {
  countIdeas,
  getAgents,
  getInvites,
  getPersonalWorkspace,
  getRail,
  getRuns,
  isMember,
  isOwner,
  pendingRequests,
} from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
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
  const { user, joined } = await requireSession(`/w/${ws.id}/c/chung`);
  const personal = getPersonalWorkspace(user.id);
  const explorePath = `/w/${personal?.id}/explore`;
  if (!isMember(ws, user.id, joined)) redirect(`${explorePath}?ws=${ws.id}`);

  return (
    <>
      <WorkspaceRail items={getRail(user.id, joined)} activeId={ws.id} personalId={personal?.id ?? ws.id} />
      <WorkspaceSidebar
        ws={ws}
        agents={getAgents(ws)}
        viewerIsOwner={isOwner(ws, user.id)}
        invite={getInvites(ws.id)[0]}
        explorePath={explorePath}
        counts={{
          ideas: countIdeas(ws.id),
          runs: getRuns(ws.id).length,
          pendingRequests: pendingRequests(ws.id).length,
        }}
        footer={<UserPanel user={user} settingsHref={`/w/${ws.id}/settings`} />}
      />
      <div className="flex min-w-0 flex-1">{children}</div>
    </>
  );
}

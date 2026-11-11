// Cột kênh của workspace: menu workspace, đề bài, kênh, bảng đen, dữ kiện, agent và người dùng.
"use client";

import { usePathname } from "next/navigation";
import { Database, FileText, FlaskConical, Hash, KanbanSquare, Plus, Settings, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { ActorAvatar } from "@/components/common/actor-avatar";
import type { Agent, Invite, Workspace } from "@/lib/types";
import { NavGroup, NavItem } from "./sidebar-nav";
import { WorkspaceMenu } from "./workspace-menu";

export interface SidebarCounts {
  ideas: number;
  runs: number;
  pendingRequests: number;
}

export function WorkspaceSidebar({
  ws,
  agents,
  counts,
  viewerIsOwner,
  invite,
  explorePath,
  footer,
}: {
  ws: Workspace;
  agents: Agent[];
  counts: SidebarCounts;
  viewerIsOwner: boolean;
  invite: Invite | undefined;
  explorePath: string;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/w/${ws.id}`;
  const at = (path: string) => pathname === `${base}${path}`;
  const enabledAgents = agents.filter((a) => a.enabled);

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar">
      <WorkspaceMenu
        ws={ws}
        invite={invite}
        isOwner={viewerIsOwner}
        pendingRequests={counts.pendingRequests}
        explorePath={explorePath}
      />

      <div className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-3">
        <div className="px-2 pt-4">
          <p className="text-xs font-bold tracking-wide text-subtle uppercase">Đề bài</p>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{ws.brief}</p>
        </div>

        <NavGroup
          label="Kênh"
          action={
            <button type="button" aria-label="Tạo kênh" className="rounded text-subtle hover:text-sidebar-accent-foreground">
              <Plus className="size-4" />
            </button>
          }
        >
          {ws.channels.map((c) => (
            <NavItem key={c.id} href={`${base}/c/${c.id}`} active={at(`/c/${c.id}`)} icon={<Hash />}>
              {c.name}
            </NavItem>
          ))}
        </NavGroup>

        <NavGroup label="Bảng đen">
          <NavItem href={`${base}/board`} active={at("/board")} icon={<KanbanSquare />} count={counts.ideas}>
            Bảng ý tưởng
          </NavItem>
          <NavItem href={`${base}/brief`} active={at("/brief")} icon={<FileText />}>
            Bản tổng hợp
          </NavItem>
        </NavGroup>

        {ws.modules.includes("adom") ? (
          <NavGroup label="Dữ kiện ADOM">
            <NavItem href={`${base}/metrics`} active={pathname.startsWith(`${base}/metrics`)} icon={<FlaskConical />} tone="data">
              Bảng số liệu
            </NavItem>
            <NavItem href={`${base}/runs`} active={at("/runs")} icon={<Database />} count={counts.runs} tone="data">
              Lượt chạy
            </NavItem>
          </NavGroup>
        ) : null}

        <NavGroup label="Quản lý">
          <NavItem href={`${base}/settings`} active={at("/settings")} icon={<Settings />}>
            Thành viên và agent
          </NavItem>
          {ws.kind === "shared" && viewerIsOwner ? (
            <NavItem
              href={`${base}/requests`}
              active={at("/requests")}
              icon={<UserPlus />}
              count={counts.pendingRequests}
              highlightCount
            >
              Yêu cầu tham gia
            </NavItem>
          ) : null}
        </NavGroup>

        <NavGroup label={`Agent — ${enabledAgents.length}`}>
          {enabledAgents.map((a) => (
            <div key={a.id} className="flex h-10 items-center gap-2.5 rounded px-2 hover:bg-hover">
              <ActorAvatar kind="agent" size="sm" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[15px] font-medium text-muted-foreground">{a.handle}</p>
                <p className="truncate font-mono text-[11px] text-subtle">{a.model}</p>
              </div>
            </div>
          ))}
          {enabledAgents.length === 0 ? <p className="px-2 text-xs text-subtle">Chưa có agent.</p> : null}
        </NavGroup>
      </div>

      {footer}
    </aside>
  );
}

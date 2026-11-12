// Thanh workspace bên trái. Trên cùng là workspace riêng, dưới là nhóm "Chung" gồm các workspace chung đã vào và
// đang chờ duyệt; đáy là ba việc: tạo mới, nhập mã, khám phá. Mỗi ô có chữ bên dưới để không phải đoán theo biểu tượng.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Compass, KeyRound, NotebookPen, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryParam } from "@/hooks/use-query-param";
import type { Workspace } from "@/lib/types";
import { personalHome, sharedHome } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { JoinCodeDialog } from "@/features/join/join-code-dialog";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export interface PendingJoin {
  requestId: string;
  ws: Workspace;
}

export function WorkspaceRail({
  items,
  pending,
  activeId,
  personalId,
}: {
  items: Workspace[];
  pending: PendingJoin[];
  activeId: string;
  personalId: string;
}) {
  const exploreActive = usePathname().endsWith("/explore");
  const dialogFlag = useQueryParam("dialog");
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const [joinOpen, setJoinOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? dialogFlag === "create";
  const joinDialogOpen = joinOpen ?? dialogFlag === "join";
  const shared = items.filter((w) => w.kind === "shared");

  return (
    <nav aria-label="Chuyển workspace" className="flex w-20 shrink-0 flex-col bg-rail py-3 text-rail-foreground">
      <div className="flex min-h-0 flex-1 scrollbar-none flex-col items-center gap-3 overflow-y-auto">
        <RailWorkspace
          label="Riêng"
          title="Workspace riêng: chat với agent bằng key của bạn"
          href={personalHome(personalId)}
          active={activeId === personalId && !exploreActive}
        >
          <NotebookPen className="size-5" />
        </RailWorkspace>

        <div className="w-full px-3 pt-1">
          <div aria-hidden className="h-px bg-rail-foreground/25" />
          <p className="mt-2 text-center text-[11px] font-semibold text-rail-foreground/75">Chung</p>
        </div>

        {shared.map((ws) => (
          <RailWorkspace
            key={ws.id}
            label={ws.name}
            title={ws.name}
            href={sharedHome(ws.id)}
            active={ws.id === activeId && !exploreActive}
          >
            {ws.short}
          </RailWorkspace>
        ))}

        {pending.map(({ requestId, ws }) => (
          <RailWorkspace
            key={requestId}
            label="Chờ duyệt"
            title={`${ws.name}: đang chờ chủ workspace duyệt`}
            href={`/join/${requestId}`}
            pending
          >
            {ws.short}
            <span className="absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full border-2 border-rail bg-proposed-soft text-proposed">
              <Clock className="size-2.5" strokeWidth={3} />
            </span>
          </RailWorkspace>
        ))}

        {shared.length === 0 && pending.length === 0 ? (
          <p className="px-2 text-center text-[11px] leading-snug text-rail-foreground/70">Chưa vào workspace chung nào</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col items-center gap-1 border-t border-rail-foreground/20 px-1.5 pt-3">
        <RailAction label="Tạo mới" title="Tạo workspace chung" onClick={() => setManualOpen(true)}>
          <Plus className="size-4.5" />
        </RailAction>
        <RailAction label="Nhập mã" title="Tham gia bằng mã 7 ký tự" onClick={() => setJoinOpen(true)}>
          <KeyRound className="size-4.5" />
        </RailAction>
        <RailAction
          label="Khám phá"
          title="Tìm workspace chung và xin tham gia"
          href={`/w/${personalId}/explore`}
          active={exploreActive}
        >
          <Compass className="size-4.5" />
        </RailAction>
      </div>

      <CreateWorkspaceDialog open={open} onOpenChange={setManualOpen} />
      <JoinCodeDialog open={joinDialogOpen} onOpenChange={setJoinOpen} />
    </nav>
  );
}

// Một workspace: ô vuông bo góc có chữ tắt hoặc biểu tượng, tên ngắn bên dưới, vạch trắng bên trái khi đang mở.
function RailWorkspace({
  label,
  title,
  href,
  active = false,
  pending = false,
  children,
}: {
  label: string;
  title: string;
  href: string;
  active?: boolean;
  pending?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-label={title}
          aria-current={active ? "page" : undefined}
          className="group relative flex w-full flex-col items-center gap-1 px-1.5 outline-none"
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-2.5 left-0 w-1 rounded-r-full bg-rail-foreground transition-all",
              active ? "h-6" : "h-0 group-hover:h-3",
            )}
          />
          <span
            className={cn(
              "relative flex size-11 items-center justify-center rounded-xl text-[14px] font-semibold transition-colors group-focus-visible:ring-2 group-focus-visible:ring-rail-foreground",
              active
                ? "bg-rail-active text-rail-active-foreground shadow-sm"
                : pending
                  ? "border-2 border-dashed border-rail-foreground/55 text-rail-foreground/85 group-hover:bg-rail-tile"
                  : "bg-rail-tile text-rail-foreground group-hover:bg-rail-foreground/25",
            )}
          >
            {children}
          </span>
          <span
            className={cn(
              "w-full truncate text-center text-[11px] leading-tight",
              active ? "font-semibold text-rail-foreground" : "text-rail-foreground/80 group-hover:text-rail-foreground",
            )}
          >
            {label}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-sm font-medium">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

// Một việc ở đáy thanh: nút phẳng có biểu tượng và chữ, khác hẳn ô workspace để không nhầm là một workspace.
function RailAction({
  label,
  title,
  href,
  onClick,
  active = false,
  children,
}: {
  label: string;
  title: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  const className = cn(
    "flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rail-foreground",
    active
      ? "bg-rail-tile font-semibold text-rail-foreground"
      : "text-rail-foreground/85 hover:bg-rail-tile hover:text-rail-foreground",
  );
  const content = (
    <>
      {children}
      {label}
    </>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link href={href} title={title} aria-current={active ? "page" : undefined} className={className}>
            {content}
          </Link>
        ) : (
          <button type="button" title={title} onClick={onClick} className={className}>
            {content}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="text-sm font-medium">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

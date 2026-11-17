"use client";
// Renders the left workspace bar: home logo, personal workspace, shared and pending workspaces, and the create/join/explore actions.
import { Clock, Compass, KeyRound, NotebookPen, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { LogoMark } from "@/components/LogoMark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { JoinCodeDialog } from "@/features/join";
import { useQueryParam } from "@/hooks/use-query-param";
import { format, t } from "@/lib/i18n";
import type { JoinRequest } from "@/types/join";
import type { RailWorkspace } from "@/types/workspace";
import { cn } from "@/utils/cn";
import { toPersonalHomePath, toSharedHomePath } from "@/utils/route-paths";

import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";

export function WorkspaceRail({
  workspaces,
  pendingJoins,
  activeId,
  personalId,
}: {
  workspaces: RailWorkspace[];
  pendingJoins: JoinRequest[];
  activeId: string;
  personalId: string;
}) {
  const isExploreActive = usePathname().endsWith("/explore");
  const dialogFlag = useQueryParam("dialog");
  const [isCreateOpen, setIsCreateOpen] = useState<boolean | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState<boolean | null>(null);

  return (
    <nav aria-label={t.workspace.railLabel} className="flex w-20 shrink-0 flex-col bg-rail py-3 text-rail-foreground">
      <Link
        href="/"
        aria-label={t.workspace.homeLink}
        title={t.workspace.home}
        className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-rail-active outline-none focus-visible:ring-2 focus-visible:ring-rail-foreground"
      >
        <LogoMark className="size-7" />
      </Link>
      <div className="flex min-h-0 flex-1 scrollbar-none flex-col items-center gap-3 overflow-y-auto">
        <RailTile
          label={t.workspace.personalShort}
          title={t.workspace.personalTitle}
          href={toPersonalHomePath(personalId)}
          isActive={activeId === personalId && !isExploreActive}
        >
          <NotebookPen className="size-5" />
        </RailTile>

        <div className="w-full px-3 pt-1">
          <div aria-hidden className="h-px bg-rail-foreground/25" />
          <p className="mt-2 text-center text-[11px] font-semibold text-rail-foreground/75">{t.workspace.sharedGroup}</p>
        </div>

        {workspaces.map((workspace) => (
          <RailTile
            key={workspace.id}
            label={workspace.name}
            title={workspace.name}
            href={toSharedHomePath(workspace.id)}
            isActive={workspace.id === activeId && !isExploreActive}
          >
            {workspace.short}
          </RailTile>
        ))}

        {pendingJoins.map((joinRequest) => (
          <RailTile
            key={joinRequest.id}
            label={t.workspace.pendingShort}
            title={format(t.workspace.pendingTitle, { name: joinRequest.workspaceName ?? t.workspace.workspaceFallback })}
            href={`/join/${joinRequest.id}`}
            isPending
          >
            {joinRequest.workspace?.short ?? "?"}
            <span className="absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full border-2 border-rail bg-proposed-soft text-proposed">
              <Clock className="size-2.5" strokeWidth={3} />
            </span>
          </RailTile>
        ))}

        {workspaces.length === 0 && pendingJoins.length === 0 ? (
          <p className="px-2 text-center text-[11px] leading-snug text-rail-foreground/70">{t.workspace.noShared}</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col items-center gap-1 border-t border-rail-foreground/20 px-1.5 pt-3">
        <RailAction label={t.workspace.create} title={t.workspace.createTitle} onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4.5" />
        </RailAction>
        <RailAction label={t.workspace.enterCode} title={t.workspace.enterCodeTitle} onClick={() => setIsJoinOpen(true)}>
          <KeyRound className="size-4.5" />
        </RailAction>
        <RailAction
          label={t.workspace.explore}
          title={t.workspace.exploreTitle}
          href={`/w/${personalId}/explore`}
          isActive={isExploreActive}
        >
          <Compass className="size-4.5" />
        </RailAction>
      </div>

      <CreateWorkspaceDialog isOpen={isCreateOpen ?? dialogFlag === "create"} onOpenChange={setIsCreateOpen} />
      <JoinCodeDialog isOpen={isJoinOpen ?? dialogFlag === "join"} onOpenChange={setIsJoinOpen} />
    </nav>
  );
}

function RailTile({
  label,
  title,
  href,
  isActive = false,
  isPending = false,
  children,
}: {
  label: string;
  title: string;
  href: string;
  isActive?: boolean;
  isPending?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-label={title}
          aria-current={isActive ? "page" : undefined}
          className="group relative flex w-full flex-col items-center gap-1 px-1.5 outline-none"
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-2.5 left-0 w-1 rounded-r-full bg-rail-foreground transition-all",
              isActive ? "h-6" : "h-0 group-hover:h-3",
            )}
          />
          <span
            className={cn(
              "relative flex size-11 items-center justify-center rounded-xl text-[14px] font-semibold transition-colors group-focus-visible:ring-2 group-focus-visible:ring-rail-foreground",
              isActive
                ? "bg-rail-active text-rail-active-foreground shadow-sm"
                : isPending
                  ? "border-2 border-dashed border-rail-foreground/55 text-rail-foreground/85 group-hover:bg-rail-tile"
                  : "bg-rail-tile text-rail-foreground group-hover:bg-rail-foreground/25",
            )}
          >
            {children}
          </span>
          <span
            className={cn(
              "w-full truncate text-center text-[11px] leading-tight",
              isActive ? "font-semibold text-rail-foreground" : "text-rail-foreground/80 group-hover:text-rail-foreground",
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

function RailAction({
  label,
  title,
  href,
  onClick,
  isActive = false,
  children,
}: {
  label: string;
  title: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  children: ReactNode;
}) {
  const className = cn(
    "flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rail-foreground",
    isActive
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
          <Link href={href} title={title} aria-current={isActive ? "page" : undefined} className={className}>
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

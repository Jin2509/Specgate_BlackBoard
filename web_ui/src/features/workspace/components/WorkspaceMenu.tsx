"use client";
// Renders the workspace title of the channel column and its dropdown: share or enter a code, members, requests, summary.
import { ChevronDown, Compass, FileText, KeyRound, Settings, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { JoinCodeDialog, ShareCodeDialog } from "@/features/join";
import { t } from "@/lib/i18n";
import type { JoinCode } from "@/types/join";
import type { Workspace } from "@/types/workspace";

export function WorkspaceMenu({
  workspace,
  joinCode,
  isOwner,
  pendingRequestCount,
  explorePath,
}: {
  workspace: Workspace;
  joinCode: JoinCode | null;
  isOwner: boolean;
  pendingRequestCount: number;
  explorePath: string;
}) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const basePath = `/w/${workspace.id}`;
  const isShared = workspace.kind === "shared";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-12 w-full shrink-0 items-center gap-2 border-b border-sidebar-border px-4 text-left transition-colors outline-none hover:bg-hover data-[state=open]:bg-hover">
          <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-sidebar-accent-foreground">
            {workspace.name}
          </span>
          {isOwner && pendingRequestCount > 0 ? (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6875rem] font-bold text-primary-foreground">
              {pendingRequestCount}
            </span>
          ) : null}
          <ChevronDown className="size-4 text-sidebar-accent-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-55 p-1.5">
          {isShared ? (
            <DropdownMenuItem onSelect={() => setIsShareOpen(true)} className="text-primary-strong">
              {t.workspace.shareCode} <UserPlus className="ml-auto" />
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => setIsJoinOpen(true)} className="text-primary-strong">
                {t.workspace.joinByCode} <KeyRound className="ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={explorePath}>
                  {t.workspace.findShared} <Compass className="ml-auto" />
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`${basePath}/settings`}>
              {t.workspace.membersAndAgents} <Settings className="ml-auto" />
            </Link>
          </DropdownMenuItem>
          {isShared && isOwner ? (
            <DropdownMenuItem asChild>
              <Link href={`${basePath}/requests`}>
                {t.workspace.joinRequests}
                {pendingRequestCount > 0 ? (
                  <span className="ml-auto rounded-full bg-destructive px-1.5 text-[0.6875rem] font-bold text-primary-foreground">
                    {pendingRequestCount}
                  </span>
                ) : (
                  <Users className="ml-auto" />
                )}
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={`${basePath}/brief`}>
              {t.workspace.briefPage} <FileText className="ml-auto" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isShared ? (
        <ShareCodeDialog
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          joinCode={joinCode}
          isOwner={isOwner}
        />
      ) : (
        <JoinCodeDialog isOpen={isJoinOpen} onOpenChange={setIsJoinOpen} />
      )}
    </>
  );
}

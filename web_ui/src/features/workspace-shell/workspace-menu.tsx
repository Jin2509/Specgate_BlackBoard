// Tiêu đề cột kênh: tên workspace và menu thả xuống (chia sẻ mã hoặc nhập mã, cài đặt, yêu cầu tham gia).
"use client";

import Link from "next/link";
import { ChevronDown, Compass, FileText, KeyRound, Settings, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JoinCodeDialog } from "@/features/join/join-code-dialog";
import { ShareCodeDialog } from "@/features/join/share-code-dialog";
import type { JoinCode, Workspace } from "@/lib/types";

export function WorkspaceMenu({
  ws,
  joinCode,
  isOwner,
  pendingRequests,
  explorePath,
}: {
  ws: Workspace;
  joinCode: JoinCode | undefined;
  isOwner: boolean;
  pendingRequests: number;
  explorePath: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const base = `/w/${ws.id}`;
  const shared = ws.kind === "shared";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-12 w-full shrink-0 items-center gap-2 border-b border-sidebar-border px-4 text-left transition-colors outline-none hover:bg-hover data-[state=open]:bg-hover">
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-sidebar-accent-foreground">{ws.name}</span>
          {isOwner && pendingRequests > 0 ? (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-primary-foreground">
              {pendingRequests}
            </span>
          ) : null}
          <ChevronDown className="size-4 text-sidebar-accent-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-55 p-1.5">
          {shared ? (
            <DropdownMenuItem onSelect={() => setShareOpen(true)} className="text-primary-strong">
              Chia sẻ mã tham gia <UserPlus className="ml-auto" />
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => setJoinOpen(true)} className="text-primary-strong">
                Tham gia bằng mã <KeyRound className="ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={explorePath}>
                  Tìm workspace chung <Compass className="ml-auto" />
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`${base}/settings`}>
              Thành viên và agent <Settings className="ml-auto" />
            </Link>
          </DropdownMenuItem>
          {shared && isOwner ? (
            <DropdownMenuItem asChild>
              <Link href={`${base}/requests`}>
                Yêu cầu tham gia
                {pendingRequests > 0 ? (
                  <span className="ml-auto rounded-full bg-destructive px-1.5 text-[11px] font-bold text-primary-foreground">
                    {pendingRequests}
                  </span>
                ) : (
                  <Users className="ml-auto" />
                )}
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={`${base}/brief`}>
              Bản tổng hợp <FileText className="ml-auto" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {shared ? (
        <ShareCodeDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          workspaceId={ws.id}
          workspaceName={ws.name}
          joinCode={joinCode}
          isOwner={isOwner}
        />
      ) : (
        <JoinCodeDialog open={joinOpen} onOpenChange={setJoinOpen} />
      )}
    </>
  );
}

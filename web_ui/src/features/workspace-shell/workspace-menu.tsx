// Tiêu đề cột kênh: tên workspace và menu thả xuống (mời, cài đặt, yêu cầu tham gia).
"use client";

import Link from "next/link";
import { ChevronDown, Compass, FileText, Settings, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Invite, Workspace } from "@/lib/types";
import { InviteDialog } from "./invite-dialog";

export function WorkspaceMenu({
  ws,
  invite,
  isOwner,
  pendingRequests,
  explorePath,
}: {
  ws: Workspace;
  invite: Invite | undefined;
  isOwner: boolean;
  pendingRequests: number;
  explorePath: string;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const base = `/w/${ws.id}`;
  const shared = ws.kind === "shared";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-12 w-full shrink-0 items-center gap-2 border-b border-sidebar-border px-4 text-left shadow-[0_1px_0_rgb(0_0_0/0.2)] transition-colors outline-none hover:bg-hover data-[state=open]:bg-hover">
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
            <DropdownMenuItem onSelect={() => setInviteOpen(true)} className="text-primary-strong">
              Mời mọi người <UserPlus className="ml-auto" />
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild className="text-primary-strong">
              <Link href={explorePath}>
                Tìm workspace chung <Compass className="ml-auto" />
              </Link>
            </DropdownMenuItem>
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
      {shared ? <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} workspaceName={ws.name} invite={invite} /> : null}
    </>
  );
}

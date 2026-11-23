"use client";
// Opens a member's actions: rename yourself, leave the workspace, or (owner) remove someone, each with a confirmation.
import { Ellipsis, LogOut, Pencil, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";

import { RenameDialog } from "./RenameDialog";
import { deleteMember, deleteMyMembership } from "../api/member-actions";

export function MemberActionsMenu({
  workspaceId,
  userId,
  memberName,
  isSelf,
  canLeave,
  canRemove,
}: {
  workspaceId: string;
  userId: string;
  memberName: string;
  isSelf: boolean;
  /** A member may leave; the owner stays with the workspace. */
  canLeave: boolean;
  /** The owner may remove members; nobody may remove the owner. */
  canRemove: boolean;
}) {
  const router = useRouter();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const outcome = isSelf ? await deleteMyMembership(workspaceId) : await deleteMember(workspaceId, userId);
      if (!outcome.ok) return showErrorToast(outcome.error);
      setIsConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={format(t.settings.memberActions, { name: memberName })}
          className="inline-flex size-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isSelf ? (
            <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>
              <Pencil /> {t.settings.renameInWorkspace}
            </DropdownMenuItem>
          ) : null}
          {canLeave || canRemove ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setIsConfirmOpen(true)}>
              {isSelf ? <LogOut /> : <UserMinus />} {isSelf ? t.settings.leave : t.settings.removeMember}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {isSelf ? (
        <RenameDialog workspaceId={workspaceId} currentName={memberName} isOpen={isRenameOpen} onOpenChange={setIsRenameOpen} />
      ) : null}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={isSelf ? t.settings.leaveTitle : format(t.settings.removeTitle, { name: memberName })}
        description={isSelf ? t.settings.leaveConfirm : format(t.settings.removeConfirm, { name: memberName })}
        confirmLabel={isSelf ? t.settings.leave : t.settings.removeMember}
        isPending={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}

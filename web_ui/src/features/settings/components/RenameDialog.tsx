"use client";
// Renames the viewer within one workspace; the name must stay unique there.
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";

import { updateNickname } from "../api/member-actions";

const NICKNAME_MAX_LENGTH = 40;

export function RenameDialog({
  workspaceId,
  currentName,
  isOpen,
  onOpenChange,
}: {
  workspaceId: string;
  currentName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(currentName);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const outcome = await updateNickname(workspaceId, nickname);
              if (!outcome.ok) return showErrorToast(outcome.error);
              onOpenChange(false);
              router.refresh();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>{t.settings.renameTitle}</DialogTitle>
            <DialogDescription>{t.settings.renameDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="workspace-nickname">{t.workspace.nicknameLabel}</Label>
            <Input
              id="workspace-nickname"
              autoFocus
              value={nickname}
              maxLength={NICKNAME_MAX_LENGTH}
              onChange={(event) => setNickname(event.target.value)}
              className="h-9"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending || !nickname.trim()}>
              {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

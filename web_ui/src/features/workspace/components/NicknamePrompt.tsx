"use client";
// Asks a newcomer whose name clashes with a member's to choose a nickname for this workspace.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { updateNickname } from "@/features/settings";
import { format, t } from "@/lib/i18n";

const NICKNAME_MAX_LENGTH = 40;

export function NicknamePrompt({
  workspaceId,
  workspaceName,
  currentName,
}: {
  workspaceId: string;
  workspaceName: string;
  currentName: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [nickname, setNickname] = useState(currentName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const outcome = await updateNickname(workspaceId, nickname);
      if (!outcome.ok) return setErrorMessage(outcome.error);
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{format(t.workspace.nicknameTitle, { name: workspaceName })}</DialogTitle>
          <DialogDescription>{t.workspace.nicknameDescription}</DialogDescription>
        </DialogHeader>
        <Input
          aria-label={t.workspace.nicknameLabel}
          value={nickname}
          maxLength={NICKNAME_MAX_LENGTH}
          onChange={(event) => setNickname(event.target.value)}
        />
        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            {t.workspace.later}
          </Button>
          <Button disabled={isPending || !nickname.trim()} onClick={handleSave}>
            {t.workspace.saveName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";
// Shows a shared workspace's join code to copy and send; the owner can rotate it.
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { format, t } from "@/lib/i18n";
import type { JoinCode } from "@/types/join";

import { JoinCodeDisplay } from "./JoinCodeDisplay";
import { UpdateJoinCodeButton } from "./UpdateJoinCodeButton";

export function ShareCodeDialog({
  isOpen,
  onOpenChange,
  workspaceId,
  workspaceName,
  joinCode,
  isOwner,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  joinCode: JoinCode | null;
  isOwner: boolean;
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isCopied = joinCode !== null && copiedCode === joinCode.code;

  async function handleCopy() {
    if (!joinCode) return;
    await navigator.clipboard?.writeText(joinCode.code);
    setCopiedCode(joinCode.code);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{format(t.join.shareTitle, { workspace: workspaceName })}</DialogTitle>
          <DialogDescription>{t.join.shareDescription}</DialogDescription>
        </DialogHeader>
        {joinCode ? (
          <div className="grid gap-3">
            <JoinCodeDisplay code={joinCode.code} />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleCopy} className={isCopied ? "bg-decided hover:bg-decided" : undefined}>
                {isCopied ? <Check /> : <Copy />} {isCopied ? t.join.copiedCode : t.join.copyCode}
              </Button>
              {isOwner ? <UpdateJoinCodeButton workspaceId={workspaceId} /> : null}
            </div>
            <p className="text-xs text-subtle">
              {joinCode.createdAt ? format(t.join.createdAt, { time: joinCode.createdAt }) : ""}
              {isOwner ? t.join.ownerRegenerateHint : t.join.memberRegenerateHint}
            </p>
          </div>
        ) : isOwner ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">{t.join.noCodeOwner}</p>
            <UpdateJoinCodeButton workspaceId={workspaceId} label={t.join.createCode} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.join.noCodeMember}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

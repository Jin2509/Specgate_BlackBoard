"use client";
// Creates a channel in a shared workspace (owner only) and opens it.
import { Hash, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { t } from "@/lib/i18n";

import { createChannel, type WorkspaceFormState } from "../api/workspace-actions";

const CHANNEL_NAME_MAX_LENGTH = 40;

export function CreateChannelDialog({
  workspaceId,
  isOpen,
  onOpenChange,
}: {
  workspaceId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState<WorkspaceFormState, FormData>(createChannel, {});

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <DialogHeader>
            <DialogTitle>{t.workspace.channelDialogTitle}</DialogTitle>
            <DialogDescription>{t.workspace.channelDialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="channel-name">{t.workspace.channelName}</Label>
            <div className="flex items-center gap-2 rounded-md bg-input pl-3">
              <Hash className="size-4 text-subtle" />
              <Input
                id="channel-name"
                name="name"
                required
                autoComplete="off"
                spellCheck={false}
                maxLength={CHANNEL_NAME_MAX_LENGTH}
                className="border-0 pl-0"
              />
            </div>
            {state.error ? (
              <p role="alert" className="text-[13px] text-destructive">
                {state.error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.workspace.channelDialogTitle}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";
// Creates a shared workspace: name and brief are required; on success the main channel opens.
import { Compass, EyeOff, LoaderCircle, Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { SegmentedControl, type SegmentOption } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { useActionErrorToast } from "@/hooks/use-action-error-toast";
import { t } from "@/lib/i18n";
import type { Visibility } from "@/types/workspace";

import { createWorkspace, type WorkspaceFormState } from "../api/workspace-actions";

const NAME_MAX_LENGTH = 80;
const BRIEF_MAX_LENGTH = 4000;

const VISIBILITY_OPTIONS: Array<SegmentOption<Visibility>> = [
  {
    value: "hidden",
    label: (
      <>
        <EyeOff className="size-3.5" /> {t.workspace.visibilityHidden}
      </>
    ),
  },
  {
    value: "discoverable",
    label: (
      <>
        <Compass className="size-3.5" /> {t.workspace.visibilityDiscoverable}
      </>
    ),
  },
];

export function CreateWorkspaceDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void }) {
  const [state, formAction, isPending] = useActionState<WorkspaceFormState, FormData>(createWorkspace, {});
  useActionErrorToast(state);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("discoverable");
  const canSubmit = name.trim().length > 0 && brief.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-130"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("workspace-name")?.focus();
        }}
      >
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{t.workspace.createTitle}</DialogTitle>
            <DialogDescription>{t.workspace.createDialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="workspace-name">{t.workspace.name}</Label>
              <Input
                id="workspace-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={NAME_MAX_LENGTH}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="workspace-brief">
                {t.workspace.brief} <span className="font-normal text-muted-foreground">{t.workspace.briefRequired}</span>
              </Label>
              <Textarea
                id="workspace-brief"
                name="brief"
                rows={3}
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                maxLength={BRIEF_MAX_LENGTH}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label>{t.workspace.visibilityLabel}</Label>
              <input type="hidden" name="visibility" value={visibility} />
              <SegmentedControl
                aria-label={t.workspace.visibilityLabel}
                value={visibility}
                onChange={setVisibility}
                options={VISIBILITY_OPTIONS}
                className="grid grid-cols-2 gap-1 p-1"
                itemClassName="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs"
              />
              <p className="text-[0.6875rem] text-subtle">{t.workspace.visibilityHint}</p>
            </div>

            <p className="rounded-lg bg-input px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              {t.workspace.noWorkspaceAgent}
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Plus />} {t.workspace.createButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

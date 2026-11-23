"use client";
// Lets the owner rename the workspace and choose whether anyone can find it on the Explore page.
import { Compass, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SegmentedControl, type SegmentOption } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { t } from "@/lib/i18n";
import { showErrorToast, showSuccessToast } from "@/stores/toast-store";
import type { Visibility } from "@/types/workspace";

import { updateWorkspaceDetails } from "../api/member-actions";

const NAME_MAX_LENGTH = 80;

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

export function WorkspaceDetailsForm({
  workspaceId,
  name,
  visibility,
}: {
  workspaceId: string;
  name: string;
  visibility: Visibility;
}) {
  const router = useRouter();
  const [draftName, setDraftName] = useState(name);
  const [draftVisibility, setDraftVisibility] = useState(visibility);
  const [isPending, startTransition] = useTransition();
  const hasChanges = draftName.trim() !== name || draftVisibility !== visibility;

  function handleSave() {
    startTransition(async () => {
      const outcome = await updateWorkspaceDetails(workspaceId, { name: draftName, visibility: draftVisibility });
      if (!outcome.ok) return showErrorToast(outcome.error);
      showSuccessToast(t.settings.saved);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="workspace-name">{t.workspace.name}</Label>
        <Input
          id="workspace-name"
          value={draftName}
          maxLength={NAME_MAX_LENGTH}
          onChange={(event) => setDraftName(event.target.value)}
          className="bg-card"
        />
      </div>
      <div className="grid gap-1.5">
        <Label>{t.workspace.visibilityLabel}</Label>
        <SegmentedControl
          aria-label={t.workspace.visibilityLabel}
          value={draftVisibility}
          onChange={setDraftVisibility}
          options={VISIBILITY_OPTIONS}
          className="grid grid-cols-2 gap-1 p-1"
          itemClassName="flex items-center justify-center gap-1.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={isPending || !hasChanges || !draftName.trim()} onClick={handleSave}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.settings.saveWorkspace}
        </Button>
      </div>
    </div>
  );
}

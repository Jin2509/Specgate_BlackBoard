"use client";
// Edits the workspace brief; only the owner can save, members read it.
import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { t } from "@/lib/i18n";

import { updateBrief, type BriefFormState } from "../api/member-actions";

const BRIEF_MAX_LENGTH = 4000;

export function BriefEditor({ workspaceId, brief, canEdit }: { workspaceId: string; brief: string; canEdit: boolean }) {
  const [state, formAction, isPending] = useActionState<BriefFormState, FormData>(updateBrief, {});

  if (!canEdit) {
    return (
      <div>
        <p className="rounded-lg border border-border bg-card px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
          {brief}
        </p>
        <p className="mt-2 text-xs text-subtle">{t.settings.briefMemberHint}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <Textarea
        name="brief"
        key={brief}
        defaultValue={brief}
        rows={4}
        className="bg-card text-sm leading-relaxed"
        aria-label={t.settings.brief}
        maxLength={BRIEF_MAX_LENGTH}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.settings.saveBrief}
        </Button>
        {state.error ? (
          <span role="alert" className="text-xs text-destructive">
            {state.error}
          </span>
        ) : state.savedAt ? (
          <span role="status" className="text-xs text-decided">
            {t.settings.saved}
          </span>
        ) : (
          <span className="text-xs text-subtle">{t.settings.briefOwnerHint}</span>
        )}
      </div>
    </form>
  );
}

"use client";
// Adds a task in place, at the top level or under a larger task, without opening a dialog.
import { CornerDownLeft, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { TeamMember } from "@/types/workspace";
import { cn } from "@/utils/cn";

import { createTask } from "../api/task-actions";

const BODY_MAX_LENGTH = 200;
const NOBODY = "";

export interface TaskComposerProps {
  workspaceId: string;
  members: TeamMember[];
  viewerId: string;
  isOwner: boolean;
  /** The larger task the new one breaks down; null adds a top-level task. */
  parentNumber: number | null;
  onCancel?: () => void;
  className?: string;
}

export function TaskComposer({ workspaceId, members, viewerId, isOwner, parentNumber, onCancel, className }: TaskComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [assigneeId, setAssigneeId] = useState(viewerId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const assigneeOptions: Array<SelectOption> = [
    ...members.map((member) => ({
      value: member.user.id,
      label:
        member.user.id === viewerId ? format(t.tasks.assigneeMe, { name: member.user.displayName }) : member.user.displayName,
    })),
    { value: NOBODY, label: t.tasks.unassigned },
  ];
  const placeholder =
    parentNumber === null ? t.tasks.rootPlaceholder : format(t.tasks.childPlaceholder, { number: parentNumber });

  function handleSubmit() {
    if (!body.trim() || isPending) return;
    startTransition(async () => {
      const outcome = await createTask({
        workspaceId,
        body,
        assigneeId: isOwner ? assigneeId : viewerId,
        parentNumber,
      });
      if (!outcome.ok) return setErrorMessage(outcome.error);
      setErrorMessage(null);
      setBody("");
      router.refresh();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSubmit();
    }
    if (event.key === "Escape" && onCancel) onCancel();
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-dashed border-border bg-card/60 px-2.5 py-1.5",
          "focus-within:border-solid focus-within:border-ring",
        )}
      >
        <Plus className="size-4 shrink-0 text-subtle" />
        <Input
          value={body}
          maxLength={BODY_MAX_LENGTH}
          autoFocus={parentNumber !== null}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        {isOwner ? (
          <Select
            size="sm"
            value={assigneeId}
            onValueChange={setAssigneeId}
            options={assigneeOptions}
            aria-label={t.tasks.assigneeLabel}
            className="max-w-40 shrink-0"
          />
        ) : null}
        <Button size="sm" disabled={isPending || !body.trim()} onClick={handleSubmit} aria-label={t.tasks.add}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <CornerDownLeft />}
        </Button>
      </div>
      {errorMessage ? (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

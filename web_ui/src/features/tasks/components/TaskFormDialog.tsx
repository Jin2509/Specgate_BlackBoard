"use client";
// Adds a task or, for the owner, edits one: a member's new task is in their own name, the owner picks who does it.
import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, type SelectOption } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/workspace";

import { createTask, updateTask } from "../api/task-actions";

const BODY_MAX_LENGTH = 200;
const NOBODY = "";

export function TaskFormDialog({
  workspaceId,
  members,
  viewerId,
  isOwner,
  task,
  isOpen,
  onOpenChange,
  onSave,
}: {
  workspaceId: string;
  members: TeamMember[];
  viewerId: string;
  isOwner: boolean;
  /** The task to edit; absent when adding a new one. */
  task?: Task;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}) {
  const [body, setBody] = useState(task?.body ?? "");
  const [assigneeId, setAssigneeId] = useState(task ? (task.assignee?.id ?? NOBODY) : viewerId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const assigneeOptions: Array<SelectOption> = [
    ...members.map((member) => ({ value: member.user.id, label: member.user.displayName })),
    { value: NOBODY, label: t.tasks.unassigned },
  ];

  function handleSubmit() {
    startTransition(async () => {
      const input = { workspaceId, body, assigneeId: isOwner ? assigneeId : viewerId };
      const outcome = task ? await updateTask({ ...input, number: task.number }) : await createTask(input);
      if (!outcome.ok) return setErrorMessage(outcome.error);
      setErrorMessage(null);
      if (!task) setBody("");
      onSave();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{task ? format(t.tasks.editTitle, { number: task.number }) : t.tasks.addTitle}</DialogTitle>
          <DialogDescription>{isOwner ? t.tasks.addOwnerDescription : t.tasks.addMemberDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="task-body">{t.tasks.bodyLabel}</Label>
          <Input
            id="task-body"
            value={body}
            maxLength={BODY_MAX_LENGTH}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t.tasks.bodyPlaceholder}
          />
        </div>
        {isOwner ? (
          <div className="grid gap-1.5">
            <Label htmlFor="task-assignee">{t.tasks.assigneeLabel}</Label>
            <Select id="task-assignee" size="lg" value={assigneeId} onValueChange={setAssigneeId} options={assigneeOptions} />
          </div>
        ) : null}
        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button disabled={isPending || !body.trim()} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="animate-spin" /> : null} {task ? t.common.save : t.tasks.add}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

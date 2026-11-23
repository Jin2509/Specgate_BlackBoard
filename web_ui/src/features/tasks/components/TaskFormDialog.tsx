"use client";
// Lets the owner edit a task's description and choose who does it, themself included.
import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, type SelectOption } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/workspace";

import { updateTask } from "../api/task-actions";

const BODY_MAX_LENGTH = 200;
const NOBODY = "";

export function TaskFormDialog({
  workspaceId,
  members,
  viewerId,
  task,
  isOpen,
  onOpenChange,
  onSave,
}: {
  workspaceId: string;
  members: TeamMember[];
  viewerId: string;
  task: Task;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}) {
  const [body, setBody] = useState(task.body);
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? NOBODY);
  const [isPending, startTransition] = useTransition();
  const assigneeOptions: Array<SelectOption> = [
    ...members.map((member) => ({
      value: member.user.id,
      label:
        member.user.id === viewerId ? format(t.tasks.assigneeMe, { name: member.user.displayName }) : member.user.displayName,
    })),
    { value: NOBODY, label: t.tasks.unassigned },
  ];

  function handleSubmit() {
    startTransition(async () => {
      const outcome = await updateTask({ workspaceId, number: task.number, body, assigneeId });
      if (!outcome.ok) return showErrorToast(outcome.error);
      onSave();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{format(t.tasks.editTitle, { number: task.number })}</DialogTitle>
          <DialogDescription>{t.tasks.editDescription}</DialogDescription>
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
        <div className="grid gap-1.5">
          <Label htmlFor="task-assignee">{t.tasks.assigneeLabel}</Label>
          <Select id="task-assignee" size="lg" value={assigneeId} onValueChange={setAssigneeId} options={assigneeOptions} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button disabled={isPending || !body.trim()} onClick={handleSubmit}>
            {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

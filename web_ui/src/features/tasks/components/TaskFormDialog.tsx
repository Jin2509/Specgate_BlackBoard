"use client";
// Lets the owner edit a task's description and deadline and choose who does it, themself included.
import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { FormAlert } from "@/components/FormAlert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, type SelectOption } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/workspace";

import { updateTask } from "../api/task-actions";
import { fromLocalInputValue, toLocalInputValue } from "../utils/deadline";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [body, setBody] = useState(task.body);
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? NOBODY);
  const initialDueInput = toLocalInputValue(task.dueAt);
  const [dueInput, setDueInput] = useState(initialDueInput);
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
      setErrorMessage(null);
      const outcome = await updateTask({
        workspaceId,
        number: task.number,
        body,
        assigneeId,
        // Sent only when changed, so a task already past its deadline can still be renamed.
        ...(dueInput === initialDueInput ? {} : { dueAt: fromLocalInputValue(dueInput) }),
      });
      if (!outcome.ok) return setErrorMessage(outcome.error);
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
        <div className="grid gap-1.5">
          <Label htmlFor="task-due">{t.tasks.dueFieldLabel}</Label>
          <div className="flex items-center gap-2">
            <Input id="task-due" type="datetime-local" value={dueInput} onChange={(event) => setDueInput(event.target.value)} />
            {dueInput ? (
              <Button variant="ghost" size="sm" onClick={() => setDueInput("")}>
                {t.tasks.dueClear}
              </Button>
            ) : null}
          </div>
        </div>
        <FormAlert message={errorMessage} />
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

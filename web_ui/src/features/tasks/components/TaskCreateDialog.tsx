"use client";
// Lets the owner add a task, or a subtask of a larger one, with a deadline and optional smaller tasks in one dialog.
import { LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormAlert } from "@/components/FormAlert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { TeamMember } from "@/types/workspace";

import { createTask } from "../api/task-actions";
import { NOBODY, toAssigneeOptions } from "../utils/assignee-options";
import { fromLocalInputValue } from "../utils/deadline";

const BODY_MAX_LENGTH = 200;

interface SubtaskDraft {
  body: string;
  dueInput: string;
}

export interface TaskCreateDialogProps {
  workspaceId: string;
  members: TeamMember[];
  viewerId: string;
  /** The larger task the new one breaks down; null adds a top-level task. */
  parentNumber: number | null;
  onOpenChange: (isOpen: boolean) => void;
}

export function TaskCreateDialog(props: TaskCreateDialogProps) {
  return (
    <Dialog open onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-140">
        <TaskCreateForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function TaskCreateForm({ workspaceId, members, viewerId, parentNumber, onOpenChange }: TaskCreateDialogProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [assigneeId, setAssigneeId] = useState(NOBODY);
  const [dueInput, setDueInput] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [isPending, startTransition] = useTransition();
  const title = parentNumber === null ? t.tasks.createTitle : format(t.tasks.createChildTitle, { number: parentNumber });

  function handleSubmit() {
    if (!body.trim() || isPending) return;
    startTransition(async () => {
      setErrorMessage(null);
      const outcome = await createTask({
        workspaceId,
        body: body.trim(),
        assigneeId,
        parentNumber,
        dueAt: fromLocalInputValue(dueInput),
        subtasks: subtasks
          .filter((subtask) => subtask.body.trim())
          .map((subtask) => ({ body: subtask.body.trim(), dueAt: fromLocalInputValue(subtask.dueInput) })),
      });
      router.refresh();
      if (!outcome.ok) return setErrorMessage(outcome.error);
      onOpenChange(false);
    });
  }

  function updateSubtask(index: number, change: Partial<SubtaskDraft>) {
    setSubtasks((current) =>
      current.map((subtask, subtaskIndex) => (subtaskIndex === index ? { ...subtask, ...change } : subtask)),
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{t.tasks.createDescription}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="task-create-body">{t.tasks.bodyLabel}</Label>
        <Input
          id="task-create-body"
          autoFocus
          value={body}
          maxLength={BODY_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t.tasks.bodyPlaceholder}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="task-create-assignee">{t.tasks.assigneeLabel}</Label>
          <Select
            id="task-create-assignee"
            size="lg"
            value={assigneeId}
            onValueChange={setAssigneeId}
            options={toAssigneeOptions(members, viewerId)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="task-create-due">{t.tasks.dueFieldLabel}</Label>
          <Input
            id="task-create-due"
            type="datetime-local"
            value={dueInput}
            onChange={(event) => setDueInput(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <p className="text-sm font-medium text-foreground">{t.tasks.subtasksLabel}</p>
        {subtasks.length > 0 ? (
          <ul className="grid gap-3">
            {subtasks.map((subtask, index) => (
              <li key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <Input
                  autoFocus
                  aria-label={format(t.tasks.subtaskLabel, { index: index + 1 })}
                  value={subtask.body}
                  maxLength={BODY_MAX_LENGTH}
                  placeholder={t.tasks.subtaskPlaceholder}
                  onChange={(event) => updateSubtask(index, { body: event.target.value })}
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={format(t.tasks.removeSubtask, { index: index + 1 })}
                  title={format(t.tasks.removeSubtask, { index: index + 1 })}
                  onClick={() => setSubtasks((current) => current.filter((_, subtaskIndex) => subtaskIndex !== index))}
                >
                  <X />
                </Button>
                <Input
                  type="datetime-local"
                  aria-label={format(t.tasks.subtaskDueLabel, { index: index + 1 })}
                  value={subtask.dueInput}
                  onChange={(event) => updateSubtask(index, { dueInput: event.target.value })}
                  className="max-w-56"
                />
              </li>
            ))}
          </ul>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start"
          onClick={() => setSubtasks((current) => [...current, { body: "", dueInput }])}
        >
          <Plus /> {t.tasks.addSubtask}
        </Button>
        <p className="text-xs text-subtle">{t.tasks.subtasksHint}</p>
      </div>
      <FormAlert message={errorMessage} />
      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {t.common.cancel}
        </Button>
        <Button disabled={isPending || !body.trim()} onClick={handleSubmit}>
          {isPending ? <LoaderCircle className="animate-spin" /> : null} {t.tasks.createSubmit}
        </Button>
      </DialogFooter>
    </>
  );
}

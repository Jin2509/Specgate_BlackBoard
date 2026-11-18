// Renders one task: its task number, description, who is in charge and the actions the viewer may take.
import { Check, Ellipsis, Hand, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { format, t } from "@/lib/i18n";
import type { Task } from "@/types/task";
import { cn } from "@/utils/cn";

/** Each action is present only when the viewer may take it on this task. */
export interface TaskRowActions {
  onClaim?: () => void;
  onToggleStatus?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskRow({ task, actions, isPending }: { task: Task; actions: TaskRowActions; isPending: boolean }) {
  const isDone = task.status === "done";
  const assigner = task.assignedBy && task.assignedBy !== task.assignee?.displayName ? task.assignedBy : null;

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
      <span className="tabular mt-0.5 w-14 shrink-0 font-mono text-xs text-subtle">
        {format(t.tasks.number, { number: task.number })}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug text-foreground", isDone && "text-muted-foreground line-through")}>{task.body}</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
          {task.assignee ? (
            <>
              <ActorAvatar kind="human" initial={task.assignee.initial} colorIndex={task.assignee.color} size="xs" />
              <span className="text-muted-foreground">{task.assignee.displayName}</span>
            </>
          ) : (
            <span className="font-medium text-proposed">{t.tasks.unassigned}</span>
          )}
          {assigner ? <span>· {format(t.tasks.assignedBy, { name: assigner })}</span> : null}
          <span>· {isDone ? t.tasks.done : t.tasks.doing}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actions.onClaim ? (
          <Button size="sm" variant="secondary" disabled={isPending} onClick={actions.onClaim}>
            <Hand /> {t.tasks.claim}
          </Button>
        ) : null}
        {actions.onToggleStatus ? (
          <Button size="sm" variant={isDone ? "ghost" : "secondary"} disabled={isPending} onClick={actions.onToggleStatus}>
            {isDone ? <RotateCcw /> : <Check />} {isDone ? t.tasks.markDoing : t.tasks.markDone}
          </Button>
        ) : null}
        {actions.onEdit || actions.onDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={format(t.tasks.actions, { number: task.number })}
              className="inline-flex size-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Ellipsis className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {actions.onEdit ? (
                <DropdownMenuItem onSelect={actions.onEdit}>
                  <Pencil /> {t.common.edit}
                </DropdownMenuItem>
              ) : null}
              {actions.onDelete ? (
                <DropdownMenuItem variant="destructive" onSelect={actions.onDelete}>
                  <Trash2 /> {t.common.delete}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </li>
  );
}

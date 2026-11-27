"use client";
// Renders one task as a frame with its status, deadline and lock, and the smaller tasks it breaks down nested inside.
import { ChevronRight, Clock, Ellipsis, Hand, ListPlus, Lock, LockOpen, Pencil, Play, Trash2, Undo2 } from "lucide-react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Select, type SelectOption } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { TaskStatus } from "@/types/task";
import { cn } from "@/utils/cn";

import type { TaskView } from "../types/task-view";
import type { DeadlineTone } from "../utils/deadline";
import type { TaskTreeNode } from "../utils/task-tree";

/** Each action is present only when the viewer may take it on this task. */
export interface TaskNodeActions {
  onClaim?: () => void;
  onRelease?: () => void;
  onStart?: () => void;
  /** Owner only: give the task to this member, or to nobody (empty id). */
  onAssign?: (assigneeId: string) => void;
  onToggleDone?: () => void;
  onToggleLock?: () => void;
  onAddChild?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface TaskTreeControls {
  toActions: (node: TaskTreeNode<TaskView>) => TaskNodeActions;
  isPending: boolean;
  assigneeOptions: SelectOption[];
  isCollapsed: (taskNumber: number) => boolean;
  onToggleCollapsed: (taskNumber: number) => void;
}

const TITLE_CLASS_BY_DEPTH: Record<number, string> = {
  1: "text-[0.9375rem] font-semibold",
  2: "text-sm font-medium",
  3: "text-sm",
};

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: t.tasks.statusTodo, className: "bg-muted text-muted-foreground" },
  doing: { label: t.tasks.statusDoing, className: "bg-primary-soft text-primary-strong" },
  done: { label: t.tasks.statusDone, className: "bg-decided-soft text-decided" },
};

const DEADLINE_META: Record<DeadlineTone, { text: string; className: string }> = {
  overdue: { text: t.tasks.dueOverdue, className: "bg-rejected-soft font-semibold text-rejected" },
  soon: { text: t.tasks.dueSoon, className: "bg-proposed-soft font-medium text-proposed" },
  later: { text: t.tasks.dueLater, className: "bg-muted text-muted-foreground" },
  done: { text: t.tasks.dueDone, className: "text-subtle" },
};

export function TaskNode({ node, controls }: { node: TaskTreeNode<TaskView>; controls: TaskTreeControls }) {
  const { task, depth, children, doneCount, totalCount } = node;
  const actions = controls.toActions(node);
  const isDone = task.status === "done";
  const isExpanded = children.length > 0 && !controls.isCollapsed(task.number);

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        depth === 1 ? "shadow-xs" : "rounded-lg",
        task.deadlineTone === "overdue" ? "border-rejected-line" : "border-border",
        isDone && "bg-card/60",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-2 gap-y-2 px-2.5 py-2.5 sm:flex-nowrap sm:gap-2.5 sm:px-3">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-2.5">
          {children.length > 0 ? (
            <button
              type="button"
              onClick={() => controls.onToggleCollapsed(task.number)}
              aria-expanded={isExpanded}
              aria-label={format(isExpanded ? t.tasks.collapse : t.tasks.expand, { number: task.number })}
              className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ChevronRight className={cn("size-4 transition-transform", isExpanded && "rotate-90")} />
            </button>
          ) : (
            <span className="size-5 shrink-0" />
          )}
          <Checkbox
            checked={isDone}
            disabled={!actions.onToggleDone || controls.isPending}
            onCheckedChange={actions.onToggleDone}
            aria-label={format(isDone ? t.tasks.markDoing : t.tasks.markDone, { number: task.number })}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "leading-snug text-foreground",
                TITLE_CLASS_BY_DEPTH[depth],
                isDone && "text-muted-foreground line-through",
              )}
            >
              <span className="tabular mr-1.5 font-mono text-xs font-normal text-subtle">
                {format(t.tasks.number, { number: task.number })}
              </span>
              {task.body}
            </p>
            <TaskBadges task={task} />
            {totalCount > 0 ? <TaskProgress doneCount={doneCount} totalCount={totalCount} /> : null}
          </div>
        </div>
        <div className="ml-7 flex shrink-0 flex-wrap items-center gap-1 sm:ml-0">
          <TaskHolder
            task={task}
            onClaim={actions.onClaim}
            onAssign={actions.onAssign}
            assigneeOptions={controls.assigneeOptions}
            isPending={controls.isPending}
          />
          {actions.onStart ? (
            <Button size="sm" variant="secondary" disabled={controls.isPending} onClick={actions.onStart}>
              <Play /> {t.tasks.start}
            </Button>
          ) : null}
          {actions.onRelease ? (
            <Button size="sm" variant="ghost" disabled={controls.isPending} onClick={actions.onRelease}>
              <Undo2 /> {t.tasks.release}
            </Button>
          ) : null}
          {actions.onAddChild ? (
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={controls.isPending}
              onClick={actions.onAddChild}
              aria-label={format(t.tasks.addChild, { number: task.number })}
              title={format(t.tasks.addChild, { number: task.number })}
            >
              <ListPlus />
            </Button>
          ) : null}
          <TaskMenu task={task} actions={actions} />
        </div>
      </div>
      {isExpanded ? (
        <div className="border-t border-border bg-muted/40 px-1.5 py-2 pl-3 sm:px-2.5 sm:py-2.5 sm:pl-6">
          <ul className="grid gap-2 border-l-2 border-border pl-2 sm:pl-3">
            {children.map((child) => (
              <TaskNode key={child.task.id} node={child} controls={controls} />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function TaskBadges({ task }: { task: TaskView }) {
  const status = STATUS_META[task.status];
  const deadline = task.deadlineTone && task.dueLabel ? DEADLINE_META[task.deadlineTone] : null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
      <span className={cn("rounded-full px-2 py-0.5 font-medium", status.className)}>{status.label}</span>
      {deadline ? (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", deadline.className)}>
          <Clock aria-hidden className="size-3" /> {format(deadline.text, { time: task.dueLabel })}
        </span>
      ) : null}
      {task.locked ? (
        <span
          title={t.tasks.lockedTaskTitle}
          className="inline-flex items-center gap-1 rounded-full bg-proposed-soft px-2 py-0.5 font-medium text-proposed"
        >
          <Lock aria-hidden className="size-3" /> {t.tasks.lockedBadge}
        </span>
      ) : null}
    </div>
  );
}

function TaskProgress({ doneCount, totalCount }: { doneCount: number; totalCount: number }) {
  const percent = Math.round((doneCount / totalCount) * 100);
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:w-24">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <span className="tabular text-xs whitespace-nowrap text-subtle">
        {format(t.tasks.progress, { done: doneCount, total: totalCount })}
      </span>
    </div>
  );
}

function TaskHolder({
  task,
  onClaim,
  onAssign,
  assigneeOptions,
  isPending,
}: {
  task: TaskView;
  onClaim?: () => void;
  onAssign?: (assigneeId: string) => void;
  assigneeOptions: SelectOption[];
  isPending: boolean;
}) {
  if (onAssign) {
    return (
      <Select
        size="sm"
        value={task.assignee?.id ?? ""}
        onValueChange={onAssign}
        options={assigneeOptions}
        isDisabled={isPending}
        aria-label={format(t.tasks.assignTask, { number: task.number })}
        className="max-w-40 shrink-0"
      />
    );
  }
  if (task.assignee) {
    const assigner = task.assignedBy && task.assignedBy !== task.assignee.displayName ? task.assignedBy : null;
    return (
      <span
        className="mr-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        title={assigner ? format(t.tasks.assignedBy, { name: assigner }) : undefined}
      >
        <ActorAvatar kind="human" initial={task.assignee.initial} colorIndex={task.assignee.color} size="xs" />
        <span className="max-w-28 truncate">{task.assignee.displayName}</span>
      </span>
    );
  }
  if (onClaim) {
    return (
      <Button size="sm" disabled={isPending} onClick={onClaim}>
        <Hand /> {t.tasks.claim}
      </Button>
    );
  }
  return <span className="mr-1 text-xs font-medium text-proposed">{t.tasks.waitingClaim}</span>;
}

function TaskMenu({ task, actions }: { task: TaskView; actions: TaskNodeActions }) {
  if (!actions.onEdit && !actions.onDelete && !actions.onToggleLock) return null;
  return (
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
        {actions.onToggleLock ? (
          <DropdownMenuItem onSelect={actions.onToggleLock}>
            {task.locked ? <LockOpen /> : <Lock />} {task.locked ? t.tasks.unlockTask : t.tasks.lockTask}
          </DropdownMenuItem>
        ) : null}
        {actions.onDelete ? (
          <DropdownMenuItem variant="destructive" onSelect={actions.onDelete}>
            <Trash2 /> {t.common.delete}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

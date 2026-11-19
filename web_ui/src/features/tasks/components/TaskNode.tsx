"use client";
// Renders one task as a frame, with the smaller tasks it breaks down nested inside it.
import { ChevronRight, Ellipsis, Hand, ListPlus, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { ActorAvatar } from "@/components/ActorAvatar";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { format, t } from "@/lib/i18n";
import type { Task } from "@/types/task";
import { cn } from "@/utils/cn";

import type { TaskTreeNode } from "../utils/task-tree";

/** Each action is present only when the viewer may take it on this task. */
export interface TaskNodeActions {
  onClaim?: () => void;
  onToggleStatus?: () => void;
  onAddChild?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface TaskTreeControls {
  toActions: (node: TaskTreeNode) => TaskNodeActions;
  isPending: boolean;
  isCollapsed: (taskNumber: number) => boolean;
  onToggleCollapsed: (taskNumber: number) => void;
  /** The composer shown under a task while someone adds a subtask to it. */
  renderChildComposer: (task: Task) => ReactNode;
}

const TITLE_CLASS_BY_DEPTH: Record<number, string> = {
  1: "text-[15px] font-semibold",
  2: "text-sm font-medium",
  3: "text-sm",
};

export function TaskNode({ node, controls }: { node: TaskTreeNode; controls: TaskTreeControls }) {
  const { task, depth, children, doneCount, totalCount } = node;
  const actions = controls.toActions(node);
  const isDone = task.status === "done";
  const composer = controls.renderChildComposer(task);
  const hasInner = children.length > 0 || composer !== null;
  const isExpanded = hasInner && (!controls.isCollapsed(task.number) || composer !== null);

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        depth === 1 ? "shadow-xs" : "rounded-lg",
        isDone && "bg-card/60",
      )}
    >
      <div className="flex items-start gap-2 px-2.5 py-2.5 sm:gap-2.5 sm:px-3">
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
          disabled={!actions.onToggleStatus || controls.isPending}
          onCheckedChange={actions.onToggleStatus}
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
          {totalCount > 0 ? <TaskProgress doneCount={doneCount} totalCount={totalCount} /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TaskHolder task={task} onClaim={actions.onClaim} isPending={controls.isPending} />
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
          {children.length > 0 ? (
            <ul className="grid gap-2 border-l-2 border-border pl-2 sm:pl-3">
              {children.map((child) => (
                <TaskNode key={child.task.id} node={child} controls={controls} />
              ))}
            </ul>
          ) : null}
          {composer ? <div className={cn(children.length > 0 && "mt-2")}>{composer}</div> : null}
        </div>
      ) : null}
    </li>
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

function TaskHolder({ task, onClaim, isPending }: { task: Task; onClaim?: () => void; isPending: boolean }) {
  if (task.assignee) {
    const assigner = task.assignedBy && task.assignedBy !== task.assignee.displayName ? task.assignedBy : null;
    return (
      <span
        className="mr-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        title={assigner ? format(t.tasks.assignedBy, { name: assigner }) : undefined}
      >
        <ActorAvatar kind="human" initial={task.assignee.initial} colorIndex={task.assignee.color} size="xs" />
        <span className="hidden max-w-28 truncate sm:inline">{task.assignee.displayName}</span>
      </span>
    );
  }
  if (onClaim) {
    return (
      <Button size="sm" variant="secondary" disabled={isPending} onClick={onClaim}>
        <Hand /> {t.tasks.claim}
      </Button>
    );
  }
  return <span className="mr-1 text-xs font-medium text-proposed">{t.tasks.unassigned}</span>;
}

function TaskMenu({ task, actions }: { task: Task; actions: TaskNodeActions }) {
  if (!actions.onEdit && !actions.onDelete) return null;
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
        {actions.onDelete ? (
          <DropdownMenuItem variant="destructive" onSelect={actions.onDelete}>
            <Trash2 /> {t.common.delete}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

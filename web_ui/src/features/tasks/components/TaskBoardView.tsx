"use client";
// Renders the task board as a tree of tasks with deadlines: the owner adds and locks, members claim and report progress.
import { ClipboardList, Lock, LockOpen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/Button";
import { format, t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";
import type { Task } from "@/types/task";
import type { TeamMember } from "@/types/workspace";
import { cn } from "@/utils/cn";
import { toContentWidthClassName } from "@/utils/content-width";

import { TaskAssignHint } from "./TaskAssignHint";
import { TaskCreateDialog } from "./TaskCreateDialog";
import { TaskFormDialog } from "./TaskFormDialog";
import { TaskNode, type TaskNodeActions, type TaskTreeControls } from "./TaskNode";
import {
  claimTask,
  deleteTask,
  releaseTask,
  updateTask,
  updateTaskItemLock,
  updateTaskLock,
  updateTaskStatus,
  type TaskOutcome,
} from "../api/task-actions";
import type { TaskView } from "../types/task-view";
import { toAssigneeOptions } from "../utils/assignee-options";
import { TASK_MAX_DEPTH, toTaskTree, type TaskTreeNode } from "../utils/task-tree";

export function TaskBoardView({
  workspaceId,
  board,
  members,
  viewerId,
  isOwner,
  joinCode,
}: {
  workspaceId: string;
  board: { locked: boolean; tasks: TaskView[] };
  members: TeamMember[];
  viewerId: string;
  isOwner: boolean;
  joinCode: string | null;
}) {
  const router = useRouter();
  // undefined: no dialog; null: a new top-level task; a number: a subtask of that task.
  const [creatingUnder, setCreatingUnder] = useState<number | null | undefined>(undefined);
  const [collapsedNumbers, setCollapsedNumbers] = useState<ReadonlySet<number>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();
  const tree = toTaskTree(board.tasks);
  const canChangeBoard = !board.locked;
  const canManage = isOwner && canChangeBoard;
  const countOf = (status: Task["status"]) => board.tasks.filter((task) => task.status === status).length;
  const mineCount = board.tasks.filter((task) => task.status !== "done" && task.assignee?.id === viewerId).length;
  const overdueCount = board.tasks.filter((task) => task.deadlineTone === "overdue").length;

  function runUpdate(update: () => Promise<TaskOutcome>, onSuccess?: () => void) {
    startTransition(async () => {
      const outcome = await update();
      if (!outcome.ok) return showErrorToast(outcome.error);
      onSuccess?.();
      router.refresh();
    });
  }

  function toActions({ task, depth }: TaskTreeNode<TaskView>): TaskNodeActions {
    const isMine = task.assignee?.id === viewerId;
    const isOpen = task.status !== "done";
    // Who does what is frozen by either lock; progress is not.
    const isFrozen = board.locked || task.locked;
    const canManageTask = isOwner && !isFrozen;
    const run = (update: () => Promise<TaskOutcome>) => () => runUpdate(update);
    return {
      onClaim: !task.assignee && isOpen && !isFrozen ? run(() => claimTask(workspaceId, task.number)) : undefined,
      onRelease: isMine && isOpen && !isFrozen ? run(() => releaseTask(workspaceId, task.number)) : undefined,
      onStart:
        task.status === "todo" && task.assignee && (isMine || canManageTask)
          ? run(() => updateTaskStatus(workspaceId, task.number, "doing"))
          : undefined,
      onAssign:
        canManageTask && isOpen
          ? (assigneeId) => runUpdate(() => updateTask({ workspaceId, number: task.number, body: task.body, assigneeId }))
          : undefined,
      onToggleDone:
        isMine || (isOwner && !board.locked)
          ? run(() => updateTaskStatus(workspaceId, task.number, isOpen ? "done" : "doing"))
          : undefined,
      onToggleLock: isOwner ? run(() => updateTaskItemLock(workspaceId, task.number, !task.locked)) : undefined,
      onAddChild: canManageTask && depth < TASK_MAX_DEPTH ? () => setCreatingUnder(task.number) : undefined,
      onEdit: canManageTask ? () => setEditingTask(task) : undefined,
      onDelete: canManageTask ? () => setDeletingTask(task) : undefined,
    };
  }

  const controls: TaskTreeControls = {
    toActions,
    isPending,
    assigneeOptions: toAssigneeOptions(members, viewerId),
    isCollapsed: (taskNumber) => collapsedNumbers.has(taskNumber),
    onToggleCollapsed: (taskNumber) =>
      setCollapsedNumbers((current) => {
        const next = new Set(current);
        if (!next.delete(taskNumber)) next.add(taskNumber);
        return next;
      }),
  };

  return (
    <PageLayout>
      <PageHeader
        icon={<ClipboardList />}
        title={t.tasks.pageTitle}
        meta={
          format(t.tasks.pageMeta, {
            todo: countOf("todo"),
            doing: countOf("doing"),
            done: countOf("done"),
            mine: mineCount,
          }) + (overdueCount ? format(t.tasks.overdueMeta, { count: overdueCount }) : "")
        }
        actions={
          isOwner ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => runUpdate(() => updateTaskLock(workspaceId, !board.locked))}
            >
              {board.locked ? <LockOpen /> : <Lock />}
              <span className="@max-2xl/header:sr-only">{board.locked ? t.tasks.unlock : t.tasks.lock}</span>
            </Button>
          ) : null
        }
      />

      <PageBody>
        <div className={toContentWidthClassName("wide")}>
          {board.locked ? null : (
            <TaskAssignHint
              isOwner={isOwner}
              memberCount={members.length}
              joinCode={joinCode}
              requestsHref={`/w/${workspaceId}/requests`}
            />
          )}
          {board.locked ? (
            <p
              role="status"
              className="mb-4 flex items-start gap-2 rounded-lg bg-proposed-soft px-3.5 py-2.5 text-sm text-foreground"
            >
              <Lock className="mt-0.5 size-4 shrink-0 text-proposed" /> {t.tasks.lockedNotice}
            </p>
          ) : null}
          {tree.length === 0 && board.locked ? <p className="text-sm text-subtle">{t.tasks.empty}</p> : null}
          {tree.length > 0 ? (
            <ul className="grid gap-3">
              {tree.map((node) => (
                <TaskNode key={node.task.id} node={node} controls={controls} />
              ))}
            </ul>
          ) : null}
          {canManage ? (
            <Button
              variant="outline"
              className={cn("w-full justify-start border-dashed text-subtle", tree.length > 0 && "mt-3")}
              onClick={() => setCreatingUnder(null)}
            >
              <Plus /> {t.tasks.add}
            </Button>
          ) : null}
        </div>
      </PageBody>

      {creatingUnder !== undefined && canManage ? (
        <TaskCreateDialog
          workspaceId={workspaceId}
          members={members}
          viewerId={viewerId}
          parentNumber={creatingUnder}
          onOpenChange={(isOpen) => (isOpen ? null : setCreatingUnder(undefined))}
        />
      ) : null}
      {editingTask ? (
        <TaskFormDialog
          key={editingTask.id}
          workspaceId={workspaceId}
          members={members}
          viewerId={viewerId}
          task={editingTask}
          isOpen
          onOpenChange={(isOpen) => (isOpen ? null : setEditingTask(null))}
          onSave={() => {
            setEditingTask(null);
            router.refresh();
          }}
        />
      ) : null}
      <ConfirmDialog
        isOpen={deletingTask !== null}
        onOpenChange={(isOpen) => (isOpen ? null : setDeletingTask(null))}
        title={format(t.tasks.deleteTitle, { number: deletingTask?.number ?? "" })}
        description={t.tasks.deleteConfirm}
        confirmLabel={t.common.delete}
        isPending={isPending}
        onConfirm={() => {
          if (!deletingTask) return;
          runUpdate(
            () => deleteTask(workspaceId, deletingTask.number),
            () => setDeletingTask(null),
          );
        }}
      />
    </PageLayout>
  );
}

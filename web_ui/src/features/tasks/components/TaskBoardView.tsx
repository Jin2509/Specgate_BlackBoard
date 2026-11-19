"use client";
// Renders the task board as a tree of task frames, from the largest tasks down, with in-place adding and the owner's lock.
import { ClipboardList, Lock, LockOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/Button";
import { format, t } from "@/lib/i18n";
import type { Task, TaskBoard } from "@/types/task";
import type { TeamMember } from "@/types/workspace";
import { toContentWidthClassName } from "@/utils/content-width";

import { TaskComposer } from "./TaskComposer";
import { TaskFormDialog } from "./TaskFormDialog";
import { TaskNode, type TaskNodeActions, type TaskTreeControls } from "./TaskNode";
import { claimTask, deleteTask, updateTaskLock, updateTaskStatus, type TaskOutcome } from "../api/task-actions";
import { TASK_MAX_DEPTH, toTaskTree, type TaskTreeNode } from "../utils/task-tree";

export function TaskBoardView({
  workspaceId,
  board,
  members,
  viewerId,
  isOwner,
}: {
  workspaceId: string;
  board: TaskBoard;
  members: TeamMember[];
  viewerId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [addingUnder, setAddingUnder] = useState<number | null>(null);
  const [collapsedNumbers, setCollapsedNumbers] = useState<ReadonlySet<number>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const tree = toTaskTree(board.tasks);
  const canChangeBoard = !board.locked;
  const canManage = isOwner && canChangeBoard;
  const doneCount = board.tasks.filter((task) => task.status === "done").length;
  const mineCount = board.tasks.filter((task) => task.status !== "done" && task.assignee?.id === viewerId).length;

  function runUpdate(update: () => Promise<TaskOutcome>, onSuccess?: () => void) {
    startTransition(async () => {
      const outcome = await update();
      if (!outcome.ok) return setErrorMessage(outcome.error);
      setErrorMessage(null);
      onSuccess?.();
      router.refresh();
    });
  }

  function toActions({ task, depth }: TaskTreeNode): TaskNodeActions {
    const isMine = task.assignee?.id === viewerId;
    const nextStatus = task.status === "done" ? "doing" : "done";
    const canAddChild = canChangeBoard && depth < TASK_MAX_DEPTH;
    return {
      onClaim:
        canChangeBoard && !task.assignee && task.status === "doing"
          ? () => runUpdate(() => claimTask(workspaceId, task.number))
          : undefined,
      onToggleStatus:
        isMine || canManage ? () => runUpdate(() => updateTaskStatus(workspaceId, task.number, nextStatus)) : undefined,
      onAddChild: canAddChild ? () => setAddingUnder(task.number) : undefined,
      onEdit: canManage ? () => setEditingTask(task) : undefined,
      onDelete: canManage ? () => setDeletingTask(task) : undefined,
    };
  }

  const controls: TaskTreeControls = {
    toActions,
    isPending,
    isCollapsed: (taskNumber) => collapsedNumbers.has(taskNumber),
    onToggleCollapsed: (taskNumber) =>
      setCollapsedNumbers((current) => {
        const next = new Set(current);
        if (!next.delete(taskNumber)) next.add(taskNumber);
        return next;
      }),
    renderChildComposer: (task) =>
      canChangeBoard && addingUnder === task.number ? (
        <TaskComposer
          workspaceId={workspaceId}
          members={members}
          viewerId={viewerId}
          isOwner={isOwner}
          parentNumber={task.number}
          onCancel={() => setAddingUnder(null)}
        />
      ) : null,
  };

  return (
    <PageLayout>
      <PageHeader
        icon={<ClipboardList />}
        title={t.tasks.pageTitle}
        meta={format(t.tasks.pageMeta, { doing: board.tasks.length - doneCount, done: doneCount, mine: mineCount })}
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
          {board.locked ? (
            <p
              role="status"
              className="mb-4 flex items-start gap-2 rounded-lg bg-proposed-soft px-3.5 py-2.5 text-sm text-foreground"
            >
              <Lock className="mt-0.5 size-4 shrink-0 text-proposed" /> {t.tasks.lockedNotice}
            </p>
          ) : null}
          {errorMessage ? (
            <p role="alert" className="mb-4 rounded-lg bg-rejected-soft px-3.5 py-2.5 text-sm text-foreground">
              {errorMessage}
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
          {canChangeBoard ? (
            <TaskComposer
              workspaceId={workspaceId}
              members={members}
              viewerId={viewerId}
              isOwner={isOwner}
              parentNumber={null}
              className={tree.length > 0 ? "mt-3" : undefined}
            />
          ) : null}
        </div>
      </PageBody>

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

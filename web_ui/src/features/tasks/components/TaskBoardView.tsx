"use client";
// Renders the task board page: tasks in progress, tasks nobody holds and finished ones, with the owner's lock.
import { ClipboardList, Lock, LockOpen, Plus } from "lucide-react";
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

import { TaskFormDialog } from "./TaskFormDialog";
import { TaskRow, type TaskRowActions } from "./TaskRow";
import { claimTask, deleteTask, updateTaskLock, updateTaskStatus, type TaskOutcome } from "../api/task-actions";
import { toTaskGroups } from "../utils/task-groups";

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
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const groups = toTaskGroups(board.tasks);
  const canChangeBoard = !board.locked;
  const canManage = isOwner && canChangeBoard;

  function runUpdate(update: () => Promise<TaskOutcome>, onSuccess?: () => void) {
    startTransition(async () => {
      const outcome = await update();
      if (!outcome.ok) return setErrorMessage(outcome.error);
      setErrorMessage(null);
      onSuccess?.();
      router.refresh();
    });
  }

  function toActions(task: Task): TaskRowActions {
    const isMine = task.assignee?.id === viewerId;
    const nextStatus = task.status === "done" ? "doing" : "done";
    return {
      onClaim:
        canChangeBoard && !task.assignee && task.status === "doing"
          ? () => runUpdate(() => claimTask(workspaceId, task.number))
          : undefined,
      onToggleStatus:
        isMine || canManage ? () => runUpdate(() => updateTaskStatus(workspaceId, task.number, nextStatus)) : undefined,
      onEdit: canManage ? () => setEditingTask(task) : undefined,
      onDelete: canManage ? () => setDeletingTask(task) : undefined,
    };
  }

  const sections = [
    { title: t.tasks.doingGroup, tasks: groups.doing },
    { title: t.tasks.unassignedGroup, tasks: groups.unassigned },
    { title: t.tasks.doneGroup, tasks: groups.done },
  ].filter((section) => section.tasks.length > 0);

  return (
    <PageLayout>
      <PageHeader
        icon={<ClipboardList />}
        title={t.tasks.pageTitle}
        meta={format(t.tasks.pageMeta, { doing: groups.doing.length + groups.unassigned.length, done: groups.done.length })}
        actions={
          <>
            {isOwner ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => runUpdate(() => updateTaskLock(workspaceId, !board.locked))}
              >
                {board.locked ? <LockOpen /> : <Lock />}
                <span className="@max-2xl/header:sr-only">{board.locked ? t.tasks.unlock : t.tasks.lock}</span>
              </Button>
            ) : null}
            <Button size="sm" disabled={!canChangeBoard} onClick={() => setIsAdding(true)}>
              <Plus /> <span className="@max-2xl/header:sr-only">{t.tasks.add}</span>
            </Button>
          </>
        }
      />

      <PageBody>
        <div className={toContentWidthClassName("wide")}>
          <p className="text-sm text-muted-foreground">{t.tasks.description}</p>
          {board.locked ? (
            <p
              role="status"
              className="mt-3 flex items-start gap-2 rounded-lg bg-proposed-soft px-3.5 py-2.5 text-sm text-foreground"
            >
              <Lock className="mt-0.5 size-4 shrink-0 text-proposed" /> {t.tasks.lockedNotice}
            </p>
          ) : null}
          {errorMessage ? (
            <p role="alert" className="mt-3 rounded-lg bg-rejected-soft px-3.5 py-2.5 text-sm text-foreground">
              {errorMessage}
            </p>
          ) : null}
          {sections.length === 0 ? <p className="mt-6 text-sm text-subtle">{t.tasks.empty}</p> : null}
          {sections.map((section) => (
            <section key={section.title} className="mt-6">
              <h2 className="mb-2 text-[13px] font-semibold text-subtle">
                {section.title} ({section.tasks.length})
              </h2>
              <ul className="grid gap-2">
                {section.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} actions={toActions(task)} isPending={isPending} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PageBody>

      <TaskFormDialog
        workspaceId={workspaceId}
        members={members}
        viewerId={viewerId}
        isOwner={isOwner}
        isOpen={isAdding}
        onOpenChange={setIsAdding}
        onSave={() => {
          setIsAdding(false);
          router.refresh();
        }}
      />
      {editingTask ? (
        <TaskFormDialog
          key={editingTask.id}
          workspaceId={workspaceId}
          members={members}
          viewerId={viewerId}
          isOwner={isOwner}
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

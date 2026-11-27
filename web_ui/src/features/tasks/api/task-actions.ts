"use server";
// Creates, edits, assigns, claims, hands back, finishes and deletes tasks, and locks tasks or the whole board.
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { Task, TaskBoard, TaskStatus } from "@/types/task";

export type TaskOutcome = { ok: true } | { ok: false; error: string };

function toTasksPath(workspaceId: string): string {
  return `/workspaces/${encodeURIComponent(workspaceId)}/tasks`;
}

async function runAction(call: () => Promise<unknown>): Promise<TaskOutcome> {
  await requireSession();
  try {
    await call();
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.tasks.actionFailed) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface NewSubtask {
  body: string;
  /** ISO 8601 deadline, or null for none. */
  dueAt: string | null;
}

/**
 * Owner only. An empty `assigneeId` leaves the task waiting for a member to claim it. A `parentNumber` puts the new
 * task under that larger task. Each subtask is created under the new task, for the same person; the task is created
 * first, so a failing subtask leaves it on the board.
 */
export async function createTask(input: {
  workspaceId: string;
  body: string;
  assigneeId: string;
  parentNumber: number | null;
  dueAt?: string | null;
  subtasks?: NewSubtask[];
}): Promise<TaskOutcome> {
  await requireSession();
  const path = toTasksPath(input.workspaceId);
  let parent: Task;
  try {
    parent = await postTask(path, { body: input.body, dueAt: input.dueAt ?? null }, input.assigneeId, input.parentNumber);
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.tasks.actionFailed) };
  } finally {
    revalidatePath("/", "layout");
  }
  for (const subtask of input.subtasks ?? []) {
    try {
      await postTask(path, subtask, input.assigneeId, parent.number);
    } catch {
      revalidatePath("/", "layout");
      return { ok: false, error: t.tasks.subtaskFailed };
    }
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

function postTask(path: string, task: NewSubtask, assigneeId: string, parentNumber: number | null): Promise<Task> {
  return callApi<Task>(path, {
    method: "POST",
    body: { body: task.body, dueAt: task.dueAt, assigneeId: assigneeId || null, parentNumber },
  });
}

/** Owner only: edit the description and deadline, and give the task to someone else or to nobody. */
export async function updateTask(input: {
  workspaceId: string;
  number: number;
  body: string;
  assigneeId: string;
  /** Leave out to keep the deadline; null removes it. */
  dueAt?: string | null;
}): Promise<TaskOutcome> {
  return runAction(() =>
    callApi<Task>(`${toTasksPath(input.workspaceId)}/${input.number}`, {
      method: "PATCH",
      body: {
        body: input.body,
        assigneeId: input.assigneeId || null,
        changeAssignee: true,
        ...(input.dueAt === undefined ? {} : { dueAt: input.dueAt, changeDueAt: true }),
      },
    }),
  );
}

export async function claimTask(workspaceId: string, number: number): Promise<TaskOutcome> {
  return runAction(() => callApi<Task>(`${toTasksPath(workspaceId)}/${number}/claim`, { method: "POST" }));
}

/** The assignee hands an unfinished task back to the to-do column for someone else to claim. */
export async function releaseTask(workspaceId: string, number: number): Promise<TaskOutcome> {
  return runAction(() => callApi<Task>(`${toTasksPath(workspaceId)}/${number}/release`, { method: "POST" }));
}

/** Owner only: lock or unlock one task. */
export async function updateTaskItemLock(workspaceId: string, number: number, isLocked: boolean): Promise<TaskOutcome> {
  return runAction(() =>
    callApi<Task>(`${toTasksPath(workspaceId)}/${number}/lock`, { method: "PUT", body: { locked: isLocked } }),
  );
}

export async function updateTaskStatus(workspaceId: string, number: number, status: TaskStatus): Promise<TaskOutcome> {
  return runAction(() => callApi<Task>(`${toTasksPath(workspaceId)}/${number}/status`, { method: "PUT", body: { status } }));
}

export async function deleteTask(workspaceId: string, number: number): Promise<TaskOutcome> {
  return runAction(() => callApi(`${toTasksPath(workspaceId)}/${number}`, { method: "DELETE" }));
}

export async function updateTaskLock(workspaceId: string, isLocked: boolean): Promise<TaskOutcome> {
  return runAction(() => callApi<TaskBoard>(`${toTasksPath(workspaceId)}/lock`, { method: "PUT", body: { locked: isLocked } }));
}

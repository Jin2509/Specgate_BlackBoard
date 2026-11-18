"use server";
// Creates, edits, assigns, claims, finishes and deletes tasks, and locks or unlocks the task board.
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

/** An empty `assigneeId` leaves the task without anyone in charge, which only the owner may do. */
export async function createTask(input: { workspaceId: string; body: string; assigneeId: string }): Promise<TaskOutcome> {
  return runAction(() =>
    callApi<Task>(toTasksPath(input.workspaceId), {
      method: "POST",
      body: { body: input.body, assigneeId: input.assigneeId || null, unassigned: !input.assigneeId },
    }),
  );
}

/** Owner only: edit the description and give the task to someone else, or to nobody. */
export async function updateTask(input: {
  workspaceId: string;
  number: number;
  body: string;
  assigneeId: string;
}): Promise<TaskOutcome> {
  return runAction(() =>
    callApi<Task>(`${toTasksPath(input.workspaceId)}/${input.number}`, {
      method: "PATCH",
      body: { body: input.body, assigneeId: input.assigneeId || null, changeAssignee: true },
    }),
  );
}

export async function claimTask(workspaceId: string, number: number): Promise<TaskOutcome> {
  return runAction(() => callApi<Task>(`${toTasksPath(workspaceId)}/${number}/claim`, { method: "POST" }));
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

// Defines the task board of a shared workspace: a tree of tasks, who does each one, deadlines and the owner's locks.
import type { Profile } from "./profile";

/** To do, in progress, done. */
export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  number: number;
  /** Null for a top-level task; otherwise the number of the larger task this one breaks down. */
  parentNumber: number | null;
  body: string;
  status: TaskStatus;
  /** The owner's lock: nobody claims, hands back, reassigns, edits or deletes it; progress still moves. */
  locked: boolean;
  /** ISO 8601 deadline, or null when the task has none. */
  dueAt: string | null;
  /** The deadline has passed and the task is not done. */
  isOverdue: boolean;
  /** Null while nobody is in charge: any member may take it, the owner may assign it. */
  assignee: Profile | null;
  createdBy: string;
  assignedBy: string | null;
  createdAt: string;
  doneAt: string | null;
}

export interface TaskBoard {
  locked: boolean;
  tasks: Task[];
}

/** A task as every member's agent reads it: unfinished ones only. */
export interface ContextTask {
  number: number;
  parentNumber: number | null;
  body: string;
  assigneeName: string | null;
  status: TaskStatus;
  dueAt: string | null;
  isOverdue: boolean;
}

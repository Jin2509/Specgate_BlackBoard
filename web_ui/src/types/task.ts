// Defines the task board of a shared workspace: a tree of tasks, who does each one, and the owner's lock.
import type { Profile } from "./profile";

export type TaskStatus = "doing" | "done";

export interface Task {
  id: string;
  number: number;
  /** Null for a top-level task; otherwise the number of the larger task this one breaks down. */
  parentNumber: number | null;
  body: string;
  status: TaskStatus;
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
}

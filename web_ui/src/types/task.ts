// Defines the task board of a shared workspace: who does which task, and whether the owner locked it.
import type { Profile } from "./profile";

export type TaskStatus = "doing" | "done";

export interface Task {
  id: string;
  number: number;
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
  body: string;
  assigneeName: string | null;
}

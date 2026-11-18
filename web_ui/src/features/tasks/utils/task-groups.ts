// Splits the task board into the tasks in progress, the tasks nobody holds and the finished ones.
import type { Task } from "@/types/task";

export interface TaskGroups {
  doing: Task[];
  unassigned: Task[];
  done: Task[];
}

export function toTaskGroups(tasks: readonly Task[]): TaskGroups {
  return {
    doing: tasks.filter((task) => task.status === "doing" && task.assignee !== null),
    unassigned: tasks.filter((task) => task.status === "doing" && task.assignee === null),
    done: tasks.filter((task) => task.status === "done"),
  };
}

/** Tasks every member's agent reads: unfinished ones, assigned or not. */
export function toOpenTaskCount(tasks: readonly Task[]): number {
  return tasks.filter((task) => task.status !== "done").length;
}

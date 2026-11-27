// Arranges the flat task list into a tree, from the largest tasks down to the smallest ones.
import type { Task } from "@/types/task";

export const TASK_MAX_DEPTH = 3;

export interface TaskTreeNode<TTask extends Task = Task> {
  task: TTask;
  /** 1 for a top-level task. */
  depth: number;
  children: TaskTreeNode<TTask>[];
  /** Finished and total tasks anywhere below this one. */
  doneCount: number;
  totalCount: number;
}

function toNode<TTask extends Task>(
  task: TTask,
  depth: number,
  childrenByParent: ReadonlyMap<number, TTask[]>,
): TaskTreeNode<TTask> {
  const children = (childrenByParent.get(task.number) ?? []).map((child) => toNode(child, depth + 1, childrenByParent));
  const doneCount = children.reduce((sum, child) => sum + child.doneCount + (child.task.status === "done" ? 1 : 0), 0);
  const totalCount = children.reduce((sum, child) => sum + child.totalCount + 1, 0);
  return { task, depth, children, doneCount, totalCount };
}

/** A task whose parent is missing is shown at the top level, so it never disappears from the board. */
export function toTaskTree<TTask extends Task>(tasks: readonly TTask[]): TaskTreeNode<TTask>[] {
  const numbers = new Set(tasks.map((task) => task.number));
  const childrenByParent = new Map<number, TTask[]>();
  const roots: TTask[] = [];
  for (const task of [...tasks].sort((left, right) => left.number - right.number)) {
    if (task.parentNumber === null || !numbers.has(task.parentNumber)) {
      roots.push(task);
      continue;
    }
    childrenByParent.set(task.parentNumber, [...(childrenByParent.get(task.parentNumber) ?? []), task]);
  }
  return roots.map((task) => toNode(task, 1, childrenByParent));
}

/** Tasks every member's agent reads: unfinished ones, assigned or not. */
export function toOpenTaskCount(tasks: readonly Task[]): number {
  return tasks.filter((task) => task.status !== "done").length;
}

// Filters task results by contribution and sorts them by violation count without touching the input array.
import type { TaskResult } from "@/types/run";

export type TaskFilter = "all" | "contributing" | "other";

export type SortOrder = "ascending" | "descending";

export function listFilteredTasks(tasks: readonly TaskResult[], filter: TaskFilter, order: SortOrder): TaskResult[] {
  return tasks
    .filter((task) => filter === "all" || (filter === "contributing" ? task.contributing : !task.contributing))
    .sort((first, second) =>
      order === "descending" ? second.violations - first.violations : first.violations - second.violations,
    );
}

// Turns the server's tasks into what the board shows: each deadline formatted and classified at render time.
import type { Task } from "@/types/task";
import { toDayClock } from "@/utils/date-format";

import { toDeadlineTone } from "./deadline";
import type { TaskView } from "../types/task-view";

/** Server only: dates are formatted where they are rendered, so hydration never sees a time zone shift. */
export function toTaskViews(tasks: readonly Task[], now: Date): TaskView[] {
  return tasks.map((task) => ({
    ...task,
    dueLabel: toDayClock(task.dueAt),
    deadlineTone: task.dueAt ? toDeadlineTone(task.dueAt, task.status, now) : null,
  }));
}

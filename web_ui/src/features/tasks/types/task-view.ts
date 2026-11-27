// Defines a task as the board shows it: the server's task plus its deadline already formatted on the server.
import type { Task } from "@/types/task";

import type { DeadlineTone } from "../utils/deadline";

export interface TaskView extends Task {
  /** The deadline in the viewer's words, formatted on the server; empty when the task has none. */
  dueLabel: string;
  deadlineTone: DeadlineTone | null;
}

// Reads the task board of a shared workspace.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { TaskBoard } from "@/types/task";

export const getTaskBoard = cache((workspaceId: string) =>
  callApi<TaskBoard>(`/workspaces/${encodeURIComponent(workspaceId)}/tasks`),
);

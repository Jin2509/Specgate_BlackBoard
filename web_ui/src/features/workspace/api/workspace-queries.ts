// Reads workspaces from the backend for server components.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { Workspace } from "@/types/workspace";

export const getWorkspace = cache((workspaceId: string) => callApi<Workspace>(`/workspaces/${encodeURIComponent(workspaceId)}`));

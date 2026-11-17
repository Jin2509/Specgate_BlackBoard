// Reads the join requests of a workspace for its owner.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { JoinRequestBoard } from "@/types/join";

export const listJoinRequests = cache((workspaceId: string) =>
  callApi<JoinRequestBoard>(`/workspaces/${encodeURIComponent(workspaceId)}/join-requests`),
);

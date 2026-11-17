// Reads join requests and the Explore listing from the backend.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { ExploreListing, JoinRequest } from "@/types/join";

export const getJoinRequest = cache((requestId: string) =>
  callApi<JoinRequest>(`/join-requests/${encodeURIComponent(requestId)}`),
);

export const listExploreWorkspaces = cache((selectedWorkspaceId?: string) =>
  callApi<ExploreListing>("/explore", { query: { selected: selectedWorkspaceId } }),
);

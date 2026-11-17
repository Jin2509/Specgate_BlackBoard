// Reads the idea board and the latest summary of a workspace.
import { cache } from "react";

import { isApiError } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import type { Board, Brief } from "@/types/board";

const NOT_FOUND_STATUS = 404;

export const getBoard = cache((workspaceId: string) => callApi<Board>(`/workspaces/${encodeURIComponent(workspaceId)}/board`));

/** Return the latest summary, or null while the owner has not built one. */
export const getBrief = cache(async (workspaceId: string): Promise<Brief | null> => {
  try {
    return await callApi<Brief>(`/workspaces/${encodeURIComponent(workspaceId)}/brief`);
  } catch (error) {
    if (isApiError(error, NOT_FOUND_STATUS)) return null;
    throw error;
  }
});

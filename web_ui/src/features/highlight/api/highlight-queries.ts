// Reads the viewer's highlights for the agent, grouped by workspace.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { HighlightGroups } from "@/types/highlight";

export const listHighlights = cache((workspaceId?: string) =>
  callApi<HighlightGroups>("/highlights", { query: { workspaceId } }),
);

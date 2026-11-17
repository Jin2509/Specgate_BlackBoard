// Reads the paper runs of a workspace and one run with its results.
import { cache } from "react";

import { callApi } from "@/lib/api/server-api";
import type { PaperRun, RunList } from "@/types/run";

export const listRuns = cache((workspaceId: string) => callApi<RunList>(`/workspaces/${encodeURIComponent(workspaceId)}/runs`));

export const getRun = cache((workspaceId: string, runId: string) =>
  callApi<PaperRun>(`/workspaces/${encodeURIComponent(workspaceId)}/runs/${encodeURIComponent(runId)}`),
);

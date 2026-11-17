"use server";
// Imports paper runs, starts trial runs, changes run validity, removes runs and polls trial progress.
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { PaperRun, TrialLevel, Validity } from "@/types/run";

export type RunOutcome<T = PaperRun> = { ok: true; value: T } | { ok: false; error: string };

export type RunReport =
  | { format: "adom-export"; summaryCsv: string; perTaskCsv: string; runMeta: string }
  | { format: "specgate-run/1"; report: string };

function toRunsPath(workspaceId: string): string {
  return `/workspaces/${encodeURIComponent(workspaceId)}/runs`;
}

function toRunPath(workspaceId: string, runId: string): string {
  return `${toRunsPath(workspaceId)}/${encodeURIComponent(runId)}`;
}

async function runAction<T>(fallbackMessage: string, call: () => Promise<T>): Promise<RunOutcome<T>> {
  await requireSession();
  try {
    const value = await call();
    revalidatePath("/", "layout");
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, fallbackMessage) };
  }
}

export async function createImportedRun(input: {
  workspaceId: string;
  report: RunReport;
  name?: string;
  validity: Validity;
  invalidReason?: string;
}): Promise<RunOutcome> {
  const { workspaceId, report, ...options } = input;
  return runAction(t.runs.importFailed, () =>
    callApi<PaperRun>(`${toRunsPath(workspaceId)}/import`, { method: "POST", body: { ...report, ...options } }),
  );
}

export async function createTrialRun(workspaceId: string, taskIds: string[], level: TrialLevel): Promise<RunOutcome> {
  return runAction(t.runs.trialFailed, () =>
    callApi<PaperRun>(`${toRunsPath(workspaceId)}/trial`, { method: "POST", body: { taskIds, level } }),
  );
}

export async function updateRunValidity(input: {
  workspaceId: string;
  runId: string;
  validity: Validity;
  invalidReason?: string;
}): Promise<RunOutcome> {
  return runAction(t.runs.validityFailed, () =>
    callApi<PaperRun>(toRunPath(input.workspaceId, input.runId), {
      method: "PATCH",
      body: { validity: input.validity, invalidReason: input.invalidReason || null },
    }),
  );
}

export async function deleteRun(workspaceId: string, runId: string): Promise<RunOutcome<void>> {
  return runAction(t.runs.deleteFailed, () => callApi<void>(toRunPath(workspaceId, runId), { method: "DELETE" }));
}

/** Read the run again; after a lost connection the next poll shows the current state. */
export async function getRunProgress(workspaceId: string, runId: string): Promise<RunOutcome> {
  return runAction(t.runs.progressFailed, () => callApi<PaperRun>(toRunPath(workspaceId, runId)));
}

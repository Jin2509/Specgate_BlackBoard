// Shows per-task results of a run and how its spec repairs compare with the two baselines.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DraftAgreementPanel, MetricsShell, RepairMatrix, TaskTable } from "@/features/metrics";
import { getRun, listRuns } from "@/features/runs/server";
import { ContentSkeleton } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.metrics.repairsPageTitle };

export default function RepairsPage(props: PageProps<"/w/[workspaceId]/metrics/repairs">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <RepairsPageContent {...props} />
    </Suspense>
  );
}

async function RepairsPageContent({ params, searchParams }: PageProps<"/w/[workspaceId]/metrics/repairs">) {
  const workspace = await requireSharedWorkspace(params);
  const query = await searchParams;
  const runList = await listRuns(workspace.id);
  const runId = typeof query.run === "string" ? query.run : runList.currentId;
  if (!runId) notFound();
  const run = await getRun(workspace.id, runId).catch(() => null);
  if (!run || run.status !== "done") notFound();
  const tasks = run.taskResults ?? [];

  return (
    <MetricsShell run={run} runs={runList.runs} workspaceId={workspace.id} tab="repairs">
      {run.repairs?.length ? <RepairMatrix rows={run.repairs} /> : null}
      <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_340px]">
        <TaskTable tasks={tasks} totalViolations={run.violations} totalTasks={run.tasks} />
        <DraftAgreementPanel tasks={tasks} />
      </div>
    </MetricsShell>
  );
}

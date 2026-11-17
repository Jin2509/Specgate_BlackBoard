// Shows the six criteria of the current run, or of the run chosen with ?run=.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CriteriaLegend, CriterionCard, MetricsShell } from "@/features/metrics";
import { getRun, listRuns } from "@/features/runs/server";
import { ContentSkeleton } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.metrics.pageTitle };

export default function MetricsPage(props: PageProps<"/w/[workspaceId]/metrics">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <MetricsPageContent {...props} />
    </Suspense>
  );
}

async function MetricsPageContent({ params, searchParams }: PageProps<"/w/[workspaceId]/metrics">) {
  const workspace = await requireSharedWorkspace(params);
  const query = await searchParams;
  const runList = await listRuns(workspace.id);
  const runId = typeof query.run === "string" ? query.run : runList.currentId;
  if (!runId) notFound();
  const run = await getRun(workspace.id, runId).catch(() => null);
  if (!run || run.status !== "done") notFound();

  return (
    <MetricsShell run={run} runs={runList.runs} workspaceId={workspace.id} tab="criteria">
      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {run.criteria.map((criterion) => (
          <CriterionCard key={criterion.number} criterion={criterion} workspaceId={workspace.id} />
        ))}
      </div>
      <CriteriaLegend />
    </MetricsShell>
  );
}

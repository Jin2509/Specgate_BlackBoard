// Lists the workspace's paper runs; the owner imports results and starts trials here.
import { Database } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { ImportReportForm, RunTable, TrialRunForm } from "@/features/runs";
import { listRuns } from "@/features/runs/server";
import { ContentSkeleton } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";
import { toDayClock } from "@/utils/date-format";

export const metadata: Metadata = { title: t.runs.pageTitle };

export default function RunsPage(props: PageProps<"/w/[workspaceId]/runs">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <RunsPageContent {...props} />
    </Suspense>
  );
}

async function RunsPageContent({ params }: PageProps<"/w/[workspaceId]/runs">) {
  const workspace = await requireSharedWorkspace(params);
  const runList = await listRuns(workspace.id);
  // Without metrics, members never see this page; only the owner comes here to attach the first run.
  if (runList.runs.length === 0 && !runList.canManage) notFound();
  const runningRun = runList.runs.find((run) => run.id === runList.runningId) ?? null;

  return (
    <PageLayout>
      <PageHeader icon={<Database />} title={t.runs.pageTitle} meta={t.runs.pageMeta} />
      <PageBody className="space-y-4">
        <RunTable
          runs={runList.runs.map((run) => ({ ...run, createdAtLabel: toDayClock(run.createdAt) }))}
          currentRunId={runList.currentId}
          workspaceId={workspace.id}
          canManage={runList.canManage}
        />
        {runList.canManage ? (
          <div className="grid items-start gap-4 @4xl:grid-cols-2">
            <ImportReportForm workspaceId={workspace.id} />
            <TrialRunForm
              key={runningRun?.id ?? "idle"}
              workspaceId={workspace.id}
              runningRun={runningRun}
              maxTaskCount={runList.trialMaxTasks}
              mode={runList.trialMode}
            />
          </div>
        ) : (
          <p className="text-[13px] text-subtle">{t.runs.ownerManagesHere}</p>
        )}
      </PageBody>
    </PageLayout>
  );
}

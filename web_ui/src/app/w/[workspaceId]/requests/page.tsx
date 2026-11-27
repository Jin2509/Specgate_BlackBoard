// Lets the workspace owner approve or reject join requests.
import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AutoRefresh } from "@/components/AutoRefresh";
import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { Panel } from "@/components/Panel";
import { PendingRequestCard, ProcessedRequestsTable } from "@/features/requests";
import { listJoinRequests } from "@/features/requests/server";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { format, t } from "@/lib/i18n";
import { toSharedHomePath } from "@/utils/route-paths";

export const metadata: Metadata = { title: t.requests.pageTitle };

export default function RequestsPage(props: PageProps<"/w/[workspaceId]/requests">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <RequestsPageContent {...props} />
    </Suspense>
  );
}

async function RequestsPageContent({ params }: PageProps<"/w/[workspaceId]/requests">) {
  const workspace = await requireSharedWorkspace(params);
  if (!isOwner(workspace)) redirect(toSharedHomePath(workspace.id));
  const { pending, history } = await listJoinRequests(workspace.id);

  return (
    <PageLayout>
      <PageHeader
        icon={<UserPlus />}
        title={t.requests.pageTitle}
        meta={format(t.requests.pendingMeta, { count: pending.length })}
      />
      <PageBody className="space-y-4">
        <AutoRefresh eventType="join.request.changed" match={{ workspaceId: workspace.id }} />
        {pending.length === 0 ? (
          <Panel>
            <p className="py-6 text-center text-sm text-subtle">{t.requests.noPending}</p>
          </Panel>
        ) : null}
        {pending.map((joinRequest) => (
          <PendingRequestCard key={joinRequest.id} joinRequest={joinRequest} />
        ))}
        <ProcessedRequestsTable joinRequests={history} />
      </PageBody>
    </PageLayout>
  );
}

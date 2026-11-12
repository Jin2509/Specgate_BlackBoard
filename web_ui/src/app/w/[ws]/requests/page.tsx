// Trang duyệt yêu cầu tham gia của chủ workspace (màn 10).
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { Panel } from "@/components/common/panel";
import { PendingRequestCard } from "@/features/requests/pending-request-card";
import { ProcessedRequestsTable } from "@/features/requests/processed-requests-table";
import { getJoinRequests, getProfile, isOwner } from "@/lib/mock/queries";
import { sharedHome } from "@/lib/paths";
import { requireSession } from "@/lib/session";
import { requireSharedWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Yêu cầu tham gia" };

export default async function RequestsPage({ params }: PageProps<"/w/[ws]/requests">) {
  const ws = await requireSharedWorkspace(params);
  const { user } = await requireSession();
  if (!isOwner(ws, user.id)) redirect(sharedHome(ws.id));
  const requests = getJoinRequests(ws.id);
  const pending = requests.filter((r) => r.status === "pending");
  const done = requests.filter((r) => r.status !== "pending");

  return (
    <PageLayout>
      <PageHeader icon={<UserPlus />} title="Yêu cầu tham gia" meta={`${pending.length} đang chờ`} />
      <PageBody className="space-y-4">
        <AutoRefresh intervalMs={10000} />
        {pending.length === 0 ? (
          <Panel>
            <p className="py-6 text-center text-sm text-subtle">Không có yêu cầu nào đang chờ.</p>
          </Panel>
        ) : null}
        {pending.map((r) => {
          const requester = getProfile(r.userId);
          return requester ? <PendingRequestCard key={r.id} request={r} requester={requester} /> : null;
        })}
        <ProcessedRequestsTable
          rows={done.map((r) => ({
            request: r,
            requesterName: getProfile(r.userId)?.displayName,
            deciderName: getProfile(r.decidedBy)?.displayName,
          }))}
        />
      </PageBody>
    </PageLayout>
  );
}

// Trang khám phá workspace chung: nhập mã tham gia hoặc gửi yêu cầu tham gia.
import type { Metadata } from "next";
import { ExploreView } from "@/features/explore/explore-view";
import { getDiscoverableWorkspaces, getJoinRelation, getPendingJoins } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Khám phá" };

export default async function ExplorePage({ params }: PageProps<"/w/[ws]/explore">) {
  await requireWorkspace(params);
  const { user } = await requireSession();
  const workspaces = getDiscoverableWorkspaces();
  const relations = Object.fromEntries(workspaces.map((w) => [w.id, getJoinRelation(w, user.id)]));
  const pendingRequestIds = Object.fromEntries(getPendingJoins(user.id).map(({ request, ws: w }) => [w.id, request.id]));

  return <ExploreView workspaces={workspaces} relations={relations} pendingRequestIds={pendingRequestIds} />;
}

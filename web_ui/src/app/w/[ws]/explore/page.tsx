// Trang khám phá workspace chung: vào bằng liên kết mời hoặc gửi yêu cầu tham gia.
import type { Metadata } from "next";
import { ExploreView } from "@/features/explore/explore-view";
import { getBoard, getDiscoverableWorkspaces, getJoinRelation } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Khám phá" };

export default async function ExplorePage({ params }: PageProps<"/w/[ws]/explore">) {
  const ws = await requireWorkspace(params);
  const { user, joined } = await requireSession();
  const workspaces = getDiscoverableWorkspaces();
  const relations = Object.fromEntries(workspaces.map((w) => [w.id, getJoinRelation(w, user.id, joined)]));

  return (
    <ExploreView
      workspaces={workspaces}
      relations={relations}
      capsuleCandidates={getBoard(ws.id).filter((i) => i.kind === "idea" || i.kind === "note")}
    />
  );
}

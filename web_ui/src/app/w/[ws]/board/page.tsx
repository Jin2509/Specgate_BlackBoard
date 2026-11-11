// Trang bảng ý tưởng và hộp thoại chốt/loại một ý.
import type { Metadata } from "next";
import { BoardView } from "@/features/board/board-view";
import { getBoard } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Bảng ý tưởng" };

export default async function BoardPage({ params }: PageProps<"/w/[ws]/board">) {
  const ws = await requireWorkspace(params);
  const { user } = await requireSession();
  return <BoardView workspaceId={ws.id} viewer={user} initialItems={getBoard(ws.id)} />;
}

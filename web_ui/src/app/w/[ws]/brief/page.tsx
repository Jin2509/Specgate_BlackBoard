// Trang bản tổng hợp (màn 08).
import type { Metadata } from "next";
import { connection } from "next/server";
import { BriefView } from "@/features/brief/brief-view";
import { getBoard, getBriefHeader, isOwner } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { requireSharedWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Bản tổng hợp" };

export default async function BriefPage({ params }: PageProps<"/w/[ws]/brief">) {
  const ws = await requireSharedWorkspace(params);
  await connection(); // bảng thay đổi khi chủ đưa highlight lên hoặc chốt ý, không dựng sẵn lúc build
  const { user } = await requireSession();
  const { title, meta } = getBriefHeader(ws);
  return <BriefView title={title} brief={ws.brief} items={getBoard(ws.id)} meta={meta} canRebuild={isOwner(ws, user.id)} />;
}

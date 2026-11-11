// Trang bản tổng hợp (màn 08).
import type { Metadata } from "next";
import { BriefView } from "@/features/brief/brief-view";
import { getBoard, getBriefHeader } from "@/lib/mock/queries";
import { requireWorkspace, workspaceStaticParams } from "@/lib/workspace-route";

export const generateStaticParams = workspaceStaticParams;
export const metadata: Metadata = { title: "Bản tổng hợp" };

export default async function BriefPage({ params }: PageProps<"/w/[ws]/brief">) {
  const ws = await requireWorkspace(params);
  const { title, meta } = getBriefHeader(ws);
  return <BriefView title={title} brief={ws.brief} items={getBoard(ws.id)} meta={meta} />;
}

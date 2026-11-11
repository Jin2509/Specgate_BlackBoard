// Helper cho route /w/[ws]: sinh static params và lấy workspace hoặc trả 404.
import { notFound } from "next/navigation";
import { getWorkspace, getWorkspaceIds } from "@/lib/mock/queries";
import type { Workspace } from "@/lib/types";

export function workspaceStaticParams() {
  return getWorkspaceIds().map((ws) => ({ ws }));
}

export async function requireWorkspace(params: Promise<{ ws: string }>): Promise<Workspace> {
  const { ws: id } = await params;
  const ws = getWorkspace(id);
  if (!ws) notFound();
  return ws;
}

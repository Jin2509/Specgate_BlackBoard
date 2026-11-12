// Helper cho route /w/[ws]: sinh static params, lấy workspace hoặc trả 404, chặn trang của workspace chung ở workspace riêng.
import { notFound, redirect } from "next/navigation";
import { getWorkspace, getWorkspaceIds } from "@/lib/mock/queries";
import type { Workspace } from "@/lib/types";
import { personalHome, sharedHome } from "./paths";

export function workspaceStaticParams() {
  return getWorkspaceIds().map((ws) => ({ ws }));
}

export async function requireWorkspace(params: Promise<{ ws: string }>): Promise<Workspace> {
  const { ws: id } = await params;
  const ws = getWorkspace(id);
  if (!ws) notFound();
  return ws;
}

// Trang chỉ có ở workspace chung (bảng ý tưởng, bản tổng hợp, cài đặt, yêu cầu, số liệu).
// Workspace riêng là trang chat với agent, nên chuyển về đó.
export async function requireSharedWorkspace(params: Promise<{ ws: string }>): Promise<Workspace> {
  const ws = await requireWorkspace(params);
  if (ws.kind === "personal") redirect(personalHome(ws.id));
  return ws;
}

// Trang chỉ có ở workspace riêng (chat với agent, key, highlight).
export async function requirePersonalWorkspace(params: Promise<{ ws: string }>): Promise<Workspace> {
  const ws = await requireWorkspace(params);
  if (ws.kind === "shared") redirect(sharedHome(ws.id));
  return ws;
}

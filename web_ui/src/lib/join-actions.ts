// Server action cho luồng tham gia workspace chung: nhập mã, xin tham gia, chủ duyệt, đổi mã, hủy yêu cầu.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeJoinCode } from "@/lib/join-code";
import { cancelJoinRequest, decideJoinRequest, rotateJoinCode, submitJoinRequest } from "@/lib/mock/mutations";
import { findWorkspaceByCode, getPersonalWorkspace, isMember } from "@/lib/mock/queries";
import { requireSession } from "./session";
import { personalHome, sharedHome } from "./paths";

export interface JoinCodeState {
  error?: string;
  code?: string;
}

// Xóa bộ đệm router phía client để thanh workspace, số yêu cầu chờ và danh sách thành viên cập nhật ngay.
function refreshAll() {
  revalidatePath("/", "layout");
}

export async function joinWithCode(_prev: JoinCodeState, formData: FormData): Promise<JoinCodeState> {
  const { user } = await requireSession();
  const raw = String(formData.get("code") ?? "");
  const code = normalizeJoinCode(raw);
  if (!code) return { code: raw, error: "Mã gồm 7 ký tự chữ và số, ví dụ ADM7Q3P." };

  const ws = findWorkspaceByCode(code);
  if (!ws) return { code: raw, error: "Không tìm thấy workspace với mã này. Mã có thể đã được đổi, hãy xin mã mới." };
  if (isMember(ws, user.id)) redirect(sharedHome(ws.id));

  const result = submitJoinRequest({ workspaceId: ws.id, userId: user.id, via: "code", code });
  if (!result.ok) return { code: raw, error: "Không gửi được yêu cầu, thử lại sau." };
  refreshAll();
  redirect(`/join/${result.value.id}`);
}

export async function sendJoinRequest(formData: FormData) {
  const { user } = await requireSession();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const result = submitJoinRequest({
    workspaceId,
    userId: user.id,
    via: "explore",
    message: String(formData.get("message") ?? "").trim(),
  });
  if (!result.ok) {
    if (result.error === "already-member") redirect(sharedHome(workspaceId));
    redirect(`/w/${getPersonalWorkspace(user.id)?.id}/explore`);
  }
  refreshAll();
  redirect(`/join/${result.value.id}`);
}

export async function decideRequest(formData: FormData) {
  const { user } = await requireSession();
  decideJoinRequest(String(formData.get("requestId") ?? ""), user.id, formData.get("decision") === "approve");
  refreshAll();
}

export async function cancelRequest(formData: FormData) {
  const { user } = await requireSession();
  cancelJoinRequest(String(formData.get("requestId") ?? ""), user.id);
  refreshAll();
  redirect(personalHome(getPersonalWorkspace(user.id)?.id));
}

export async function regenerateJoinCode(formData: FormData) {
  const { user } = await requireSession();
  rotateJoinCode(String(formData.get("workspaceId") ?? ""), user.id);
  refreshAll();
}

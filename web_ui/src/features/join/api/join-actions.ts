"use server";
// Asks to join a shared workspace by code or from Explore, cancels a request and rotates the join code.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMe, requireSession } from "@/features/auth/server";
import { isApiError, toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { JoinRequest } from "@/types/join";
import { toPersonalHomePath, toSharedHomePath } from "@/utils/route-paths";

const CONFLICT_STATUS = 409;

export interface JoinCodeState {
  error?: string;
  code?: string;
}

function refreshLayout(): void {
  revalidatePath("/", "layout");
}

/** When the code belongs to a workspace the user already joined, open it; the backend does not return its id. */
async function redirectToJoinedWorkspace(rawCode: string): Promise<void> {
  const me = await requireMe();
  const code = rawCode.replace(/[\s-]/g, "").toUpperCase();
  for (const railWorkspace of me.workspaces) {
    // A workspace that fails to load just cannot be the match; the form then shows the backend's message.
    const workspace = await callApi<{ joinCode?: string | null }>(`/workspaces/${encodeURIComponent(railWorkspace.id)}`).catch(
      () => null,
    );
    if (workspace?.joinCode === code) redirect(toSharedHomePath(railWorkspace.id));
  }
}

export async function createJoinRequestByCode(_previous: JoinCodeState, formData: FormData): Promise<JoinCodeState> {
  await requireSession();
  const rawCode = String(formData.get("code") ?? "");
  let joinRequest: JoinRequest;
  try {
    joinRequest = await callApi<JoinRequest>("/join-requests", { method: "POST", body: { code: rawCode } });
  } catch (error) {
    if (isApiError(error, CONFLICT_STATUS, "ALREADY_MEMBER")) await redirectToJoinedWorkspace(rawCode);
    return { code: rawCode, error: toErrorMessage(error, t.join.requestFailed) };
  }
  refreshLayout();
  redirect(`/join/${joinRequest.id}`);
}

export async function createJoinRequest(formData: FormData): Promise<void> {
  const me = await requireMe();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  let joinRequest: JoinRequest;
  try {
    joinRequest = await callApi<JoinRequest>("/join-requests", {
      method: "POST",
      body: { workspaceId, message: String(formData.get("message") ?? "").trim() },
    });
  } catch (error) {
    if (isApiError(error, CONFLICT_STATUS, "ALREADY_MEMBER")) redirect(toSharedHomePath(workspaceId));
    redirect(`/w/${me.personalWorkspaceId}/explore?ws=${encodeURIComponent(workspaceId)}`);
  }
  refreshLayout();
  redirect(`/join/${joinRequest.id}`);
}

export async function cancelJoinRequest(formData: FormData): Promise<void> {
  const me = await requireMe();
  // A request already decided cannot be cancelled; the redirected page shows its real state instead.
  await callApi(`/join-requests/${encodeURIComponent(String(formData.get("requestId") ?? ""))}`, {
    method: "PATCH",
    body: { status: "cancelled" },
  }).catch(() => undefined);
  refreshLayout();
  redirect(toPersonalHomePath(me.personalWorkspaceId));
}

export async function updateJoinCode(formData: FormData): Promise<void> {
  await requireSession();
  // Only the owner may rotate the code; for anyone else the refreshed dialog simply keeps the current code.
  await callApi(`/workspaces/${encodeURIComponent(String(formData.get("workspaceId") ?? ""))}/join-code`, {
    method: "PUT",
  }).catch(() => undefined);
  refreshLayout();
}

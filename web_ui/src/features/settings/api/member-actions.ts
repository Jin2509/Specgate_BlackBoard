"use server";
// Updates a member's own name and team role, edits the brief, name and visibility, and handles leaving or removing members.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { Visibility } from "@/types/workspace";

export type ActionOutcome = { ok: true } | { ok: false; error: string };

export interface BriefFormState {
  error?: string;
  savedAt?: number;
}

function toWorkspacePath(workspaceId: string): string {
  return `/workspaces/${encodeURIComponent(workspaceId)}`;
}

export async function updateBrief(_previous: BriefFormState, formData: FormData): Promise<BriefFormState> {
  await requireSession();
  try {
    await callApi(toWorkspacePath(String(formData.get("workspaceId") ?? "")), {
      method: "PATCH",
      body: { brief: String(formData.get("brief") ?? "") },
    });
  } catch (error) {
    return { error: toErrorMessage(error, t.settings.briefFailed) };
  }
  revalidatePath("/", "layout");
  return { savedAt: Date.now() };
}

/** Owner only: rename the workspace and choose who can find it. */
export async function updateWorkspaceDetails(
  workspaceId: string,
  details: { name: string; visibility: Visibility },
): Promise<ActionOutcome> {
  await requireSession();
  try {
    await callApi(toWorkspacePath(workspaceId), { method: "PATCH", body: details });
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.settings.workspaceFailed) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Set the caller's name in the workspace; names are unique there. */
export async function updateNickname(workspaceId: string, nickname: string): Promise<ActionOutcome> {
  await requireSession();
  try {
    await callApi(`${toWorkspacePath(workspaceId)}/members/me/nickname`, { method: "PUT", body: { nickname } });
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.settings.nicknameFailed) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTeamRole(workspaceId: string, teamRole: string): Promise<ActionOutcome> {
  await requireSession();
  try {
    await callApi(`${toWorkspacePath(workspaceId)}/members/me/team-role`, { method: "PUT", body: { teamRole } });
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.settings.teamRoleFailed) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Leave the workspace; the person's name keeps its place in old messages. */
export async function deleteMyMembership(workspaceId: string): Promise<ActionOutcome> {
  await requireSession();
  try {
    await callApi(`${toWorkspacePath(workspaceId)}/members/me`, { method: "DELETE" });
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.settings.leaveFailed) };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteMember(workspaceId: string, userId: string): Promise<ActionOutcome> {
  await requireSession();
  try {
    await callApi(`${toWorkspacePath(workspaceId)}/members/${encodeURIComponent(userId)}`, { method: "DELETE" });
  } catch (error) {
    return { ok: false, error: toErrorMessage(error, t.settings.removeFailed) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

"use server";
// Creates shared workspaces and their channels.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/features/auth/server";
import { toErrorMessage } from "@/lib/api/http-client";
import { callApi } from "@/lib/api/server-api";
import { t } from "@/lib/i18n";
import type { Channel, Visibility, Workspace } from "@/types/workspace";
import { toChannelPath, toSharedHomePath } from "@/utils/route-paths";

export interface WorkspaceFormState {
  error?: string;
}

export async function createWorkspace(_previous: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  await requireSession();
  const visibility: Visibility = formData.get("visibility") === "discoverable" ? "discoverable" : "hidden";
  let workspace: Workspace;
  try {
    workspace = await callApi<Workspace>("/workspaces", {
      method: "POST",
      body: { name: String(formData.get("name") ?? ""), brief: String(formData.get("brief") ?? ""), visibility },
    });
  } catch (error) {
    return { error: toErrorMessage(error, t.workspace.createFailed) };
  }
  revalidatePath("/", "layout");
  redirect(toSharedHomePath(workspace.id));
}

export async function createChannel(_previous: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  await requireSession();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  let channel: Channel;
  try {
    channel = await callApi<Channel>(`/workspaces/${encodeURIComponent(workspaceId)}/channels`, {
      method: "POST",
      body: { name: String(formData.get("name") ?? "") },
    });
  } catch (error) {
    return { error: toErrorMessage(error, t.workspace.channelCreateFailed) };
  }
  revalidatePath("/", "layout");
  redirect(toChannelPath(workspaceId, channel.name));
}

// Guards workspace routes: loads the workspace, sends non-members to Explore and keeps each page in its workspace kind.
import { notFound, redirect } from "next/navigation";

import { getMe } from "@/features/auth/server";
import { isApiError } from "@/lib/api/http-client";
import type { SharedWorkspace, Workspace } from "@/types/workspace";
import { toPersonalHomePath, toSharedHomePath } from "@/utils/route-paths";

import { getWorkspace } from "./workspace-queries";

const NOT_FOUND_STATUS = 404;
const UNAUTHORIZED_STATUS = 401;
const FORBIDDEN_STATUS = 403;

export async function requireWorkspace(params: Promise<{ workspaceId: string }>): Promise<Workspace> {
  const { workspaceId } = await params;
  try {
    return await getWorkspace(workspaceId);
  } catch (error) {
    if (isApiError(error, NOT_FOUND_STATUS)) notFound();
    if (isApiError(error, UNAUTHORIZED_STATUS)) redirect(`/login?next=${encodeURIComponent(`/w/${workspaceId}`)}`);
    if (isApiError(error, FORBIDDEN_STATUS, "NOT_MEMBER")) {
      const me = await getMe();
      redirect(`/w/${me.personalWorkspaceId}/explore?ws=${encodeURIComponent(workspaceId)}`);
    }
    throw error;
  }
}

/** Require a shared workspace; the personal workspace is the agent chat, so its pages redirect there. */
export async function requireSharedWorkspace(params: Promise<{ workspaceId: string }>): Promise<SharedWorkspace> {
  const workspace = await requireWorkspace(params);
  if (workspace.kind === "personal") redirect(toPersonalHomePath(workspace.id));
  return workspace as SharedWorkspace;
}

/** Require the personal workspace; shared workspaces redirect to their main channel. */
export async function requirePersonalWorkspace(params: Promise<{ workspaceId: string }>): Promise<Workspace> {
  const workspace = await requireWorkspace(params);
  if (workspace.kind === "shared") redirect(toSharedHomePath(workspace.id));
  return workspace;
}

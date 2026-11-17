// Builds the in-app URLs of workspaces, channels and conversations.
import type { WorkspaceKind } from "@/types/workspace";

export const DEFAULT_CHANNEL = "chung";

export function toPersonalHomePath(workspaceId: string | null | undefined): string {
  return `/w/${workspaceId ?? ""}/chat`;
}

export function toSharedHomePath(workspaceId: string): string {
  return `/w/${workspaceId}/c/${DEFAULT_CHANNEL}`;
}

export function toChannelPath(workspaceId: string, channel: string): string {
  return `/w/${workspaceId}/c/${channel}`;
}

export function toWorkspaceHomePath(workspace: { id: string; kind: WorkspaceKind }): string {
  return workspace.kind === "personal" ? toPersonalHomePath(workspace.id) : toSharedHomePath(workspace.id);
}

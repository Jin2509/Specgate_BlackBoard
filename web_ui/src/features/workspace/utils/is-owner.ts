// Tells whether the viewer owns the workspace.
import type { Workspace } from "@/types/workspace";

export function isOwner(workspace: Pick<Workspace, "myRole">): boolean {
  return workspace.myRole === "owner";
}

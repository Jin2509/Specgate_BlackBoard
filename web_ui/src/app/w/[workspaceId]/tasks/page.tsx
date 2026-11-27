// Shows the task board of a shared workspace: who does which task, deadlines, and the owner's locks.
import type { Metadata } from "next";
import { Suspense } from "react";

import { requireMe } from "@/features/auth/server";
import { TaskBoardView } from "@/features/tasks";
import { getTaskBoard, toTaskViews } from "@/features/tasks/server";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";
import { startEarly } from "@/utils/start-early";

export const metadata: Metadata = { title: t.tasks.pageTitle };

export default function TasksPage(props: PageProps<"/w/[workspaceId]/tasks">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <TasksPageContent {...props} />
    </Suspense>
  );
}

async function TasksPageContent({ params }: PageProps<"/w/[workspaceId]/tasks">) {
  const { workspaceId } = await params;
  const pendingBoard = startEarly(getTaskBoard(workspaceId));
  const [workspace, me] = await Promise.all([requireSharedWorkspace(params), requireMe()]);
  const board = await pendingBoard;
  return (
    <TaskBoardView
      workspaceId={workspace.id}
      board={{ locked: board.locked, tasks: toTaskViews(board.tasks, new Date()) }}
      members={workspace.members}
      viewerId={me.user.id}
      isOwner={isOwner(workspace)}
      joinCode={workspace.joinCode ?? null}
    />
  );
}

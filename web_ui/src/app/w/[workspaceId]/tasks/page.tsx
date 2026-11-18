// Shows the task board of a shared workspace: who does which task, and the owner's lock.
import type { Metadata } from "next";
import { Suspense } from "react";

import { requireMe } from "@/features/auth/server";
import { TaskBoardView } from "@/features/tasks";
import { getTaskBoard } from "@/features/tasks/server";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.tasks.pageTitle };

export default function TasksPage(props: PageProps<"/w/[workspaceId]/tasks">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <TasksPageContent {...props} />
    </Suspense>
  );
}

async function TasksPageContent({ params }: PageProps<"/w/[workspaceId]/tasks">) {
  const workspace = await requireSharedWorkspace(params);
  const [me, board] = await Promise.all([requireMe(), getTaskBoard(workspace.id)]);
  return (
    <TaskBoardView
      workspaceId={workspace.id}
      board={board}
      members={workspace.members}
      viewerId={me.user.id}
      isOwner={isOwner(workspace)}
    />
  );
}

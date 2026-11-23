// Shows the idea board of a shared workspace, where ideas are decided or rejected.
import type { Metadata } from "next";
import { Suspense } from "react";

import { BoardView, toBoardCards } from "@/features/board";
import { getBoard } from "@/features/board/server";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";
import { startEarly } from "@/utils/start-early";

export const metadata: Metadata = { title: t.board.pageTitle };

export default function BoardPage(props: PageProps<"/w/[workspaceId]/board">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <BoardPageContent {...props} />
    </Suspense>
  );
}

async function BoardPageContent({ params }: PageProps<"/w/[workspaceId]/board">) {
  const { workspaceId } = await params;
  const pendingBoard = startEarly(getBoard(workspaceId));
  const workspace = await requireSharedWorkspace(params);
  const board = await pendingBoard;
  return <BoardView workspaceId={workspace.id} cards={toBoardCards(board)} isOwner={isOwner(workspace)} />;
}

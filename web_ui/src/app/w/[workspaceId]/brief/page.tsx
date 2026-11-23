// Shows the latest summary the owner built from the idea board.
import type { Metadata } from "next";
import { Suspense } from "react";

import { getBrief } from "@/features/board/server";
import { BriefView } from "@/features/brief";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { format, t } from "@/lib/i18n";
import { toDateClock } from "@/utils/date-format";
import { startEarly } from "@/utils/start-early";

export const metadata: Metadata = { title: t.brief.pageTitle };

export default function BriefPage(props: PageProps<"/w/[workspaceId]/brief">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <BriefPageContent {...props} />
    </Suspense>
  );
}

async function BriefPageContent({ params }: PageProps<"/w/[workspaceId]/brief">) {
  const { workspaceId } = await params;
  const pendingBrief = startEarly(getBrief(workspaceId));
  const workspace = await requireSharedWorkspace(params);
  const brief = await pendingBrief;
  const meta = brief
    ? format(t.brief.builtMeta, {
        time: toDateClock(brief.builtAt),
        name: brief.builtBy?.displayName ?? t.brief.ownerFallback,
        count: brief.memberCount,
      })
    : "";
  return (
    <BriefView
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      brief={brief}
      meta={meta}
      canRebuild={isOwner(workspace)}
    />
  );
}

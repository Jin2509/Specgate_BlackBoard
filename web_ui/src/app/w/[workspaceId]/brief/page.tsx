// Shows the latest summary the owner built from the idea board.
import type { Metadata } from "next";
import { Suspense } from "react";

import { requireSession } from "@/features/auth/server";
import { getBrief } from "@/features/board/server";
import { BriefView } from "@/features/brief";
import { ContentSkeleton, isOwner } from "@/features/workspace";
import { requireSharedWorkspace } from "@/features/workspace/server";
import { format, t } from "@/lib/i18n";
import { toDateClock } from "@/utils/date-format";

export const metadata: Metadata = { title: t.brief.pageTitle };

export default function BriefPage(props: PageProps<"/w/[workspaceId]/brief">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <BriefPageContent {...props} />
    </Suspense>
  );
}

async function BriefPageContent({ params }: PageProps<"/w/[workspaceId]/brief">) {
  const workspace = await requireSharedWorkspace(params);
  await requireSession();
  const brief = await getBrief(workspace.id);
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

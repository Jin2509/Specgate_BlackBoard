// Lets the user join a shared workspace by code or send a join request from the Explore listing.
import type { Metadata } from "next";
import { Suspense } from "react";

import { ExploreView } from "@/features/join";
import { listExploreWorkspaces } from "@/features/join/server";
import { ContentSkeleton } from "@/features/workspace";
import { requireWorkspace } from "@/features/workspace/server";
import { t } from "@/lib/i18n";
import { startEarly } from "@/utils/start-early";

export const metadata: Metadata = { title: t.join.explorePageTitle };

export default function ExplorePage(props: PageProps<"/w/[workspaceId]/explore">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ExplorePageContent {...props} />
    </Suspense>
  );
}

async function ExplorePageContent({ params, searchParams }: PageProps<"/w/[workspaceId]/explore">) {
  const { ws: selectedWorkspaceId } = await searchParams;
  const pendingExplore = startEarly(
    listExploreWorkspaces(typeof selectedWorkspaceId === "string" ? selectedWorkspaceId : undefined),
  );
  await requireWorkspace(params);
  const { workspaces, selected } = await pendingExplore;
  return <ExploreView workspaces={workspaces} preselected={selected} />;
}

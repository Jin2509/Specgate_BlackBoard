// Shows a join request waiting for the owner's approval and moves into the workspace once it is approved.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthScreen } from "@/features/auth";
import { requireMe } from "@/features/auth/server";
import { JoinStatusCard } from "@/features/join";
import { getJoinRequest } from "@/features/join/server";
import { isApiError } from "@/lib/api/http-client";
import { t } from "@/lib/i18n";
import { toSharedHomePath } from "@/utils/route-paths";

const NOT_FOUND_STATUS = 404;

export const metadata: Metadata = { title: t.join.waitingPageTitle };

export default function JoinPage({ params }: PageProps<"/join/[requestId]">) {
  return (
    <AuthScreen className="max-w-120">
      <Suspense fallback={<div className="h-96" />}>
        <JoinStatus params={params} />
      </Suspense>
    </AuthScreen>
  );
}

async function JoinStatus({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const me = await requireMe(`/join/${requestId}`);
  let joinRequest;
  try {
    joinRequest = await getJoinRequest(requestId);
  } catch (error) {
    if (isApiError(error, NOT_FOUND_STATUS)) notFound();
    throw error;
  }
  // The owner may read the request too, but this page belongs to the person asking.
  if (joinRequest.userId !== me.user.id || !joinRequest.workspace) notFound();
  if (joinRequest.status === "approved") redirect(joinRequest.redirect ?? toSharedHomePath(joinRequest.workspaceId));

  return (
    <JoinStatusCard joinRequest={joinRequest} workspace={joinRequest.workspace} personalWorkspaceId={me.personalWorkspaceId} />
  );
}

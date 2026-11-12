// Trang chờ chủ workspace duyệt yêu cầu tham gia; tự chuyển vào workspace khi được duyệt.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthScreen } from "@/features/login/auth-screen";
import { JoinStatusCard } from "@/features/join/join-status-card";
import { getJoinRequest, getPersonalWorkspace, getProfile, getWorkspace } from "@/lib/mock/queries";
import { requireSession } from "@/lib/session";
import { sharedHome } from "@/lib/paths";

export const metadata: Metadata = { title: "Chờ duyệt" };

export default function JoinPage({ params }: PageProps<"/join/[request]">) {
  return (
    <AuthScreen className="max-w-120">
      <Suspense fallback={<div className="h-96" />}>
        <JoinStatus params={params} />
      </Suspense>
    </AuthScreen>
  );
}

async function JoinStatus({ params }: { params: Promise<{ request: string }> }) {
  const { request: id } = await params;
  const { user } = await requireSession(`/join/${id}`);
  const request = getJoinRequest(id);
  const ws = getWorkspace(request?.workspaceId);
  if (!request || !ws || request.userId !== user.id) notFound();
  if (request.status === "approved") redirect(sharedHome(ws.id));

  return (
    <JoinStatusCard request={request} ws={ws} owner={getProfile(ws.ownerId)} personalId={getPersonalWorkspace(user.id)?.id} />
  );
}
